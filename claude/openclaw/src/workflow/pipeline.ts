/**
 * 콘텐츠 파이프라인 통합 모듈
 * 주제 발굴부터 발행, 모니터링까지 end-to-end 자동화
 */

import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import matter from 'gray-matter';
import { loadMoltbookConfig, MoltbookFeedbackLoop } from '../agents/moltbook/index.js';
import TopicDiscovery, { TopicRecommendation, DiscoveryResult } from '../agents/moltbook/topic-discovery.js';
import CommunityRequestExtractor from '../agents/moltbook/community-requests.js';
import { runFullValidation, FullValidationResult, calculateAverageScore } from './stages.js';

// ============================================================================
// 타입 정의
// ============================================================================

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;  // ms
  result?: unknown;
  error?: string;
}

export interface PipelineRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  stages: PipelineStage[];
  summary: {
    topicsDiscovered: number;
    topicsSelected: number;
    postsGenerated: number;
    postsValidated: number;
    postsPublished: number;
  };
  errors: string[];
}

export interface PipelineConfig {
  enabled: boolean;
  schedule: {
    dailyRunTime: string;
    postsPerDay: number;
    autoDiscover: boolean;
  };
  discovery: {
    sources: ('moltbook_trending' | 'gap_analysis' | 'community_requests' | 'openclaw_feedback' | 'vote_posts')[];
    minScore: number;
    autoPopulateWhenQueueBelow: number;
  };
  validation: {
    skipFactCheck: boolean;
    allGates: boolean;
    blockOnFailure: boolean;
  };
  moltbook: {
    sharePosts: boolean;
    collectFeedback: boolean;
    useFeedbackForDiscovery: boolean;
  };
}

export interface TopicItem {
  title: string;
  type: 'travel' | 'culture';
}

export interface GeneratedPost {
  title: string;
  type: 'travel' | 'culture';
  filePath: string;
  success: boolean;
  error?: string;
}

export interface PublishResult {
  filePath: string;
  title: string;
  success: boolean;
  blogUrl?: string;
  error?: string;
}

// ============================================================================
// 설정
// ============================================================================

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_DIR = join(process.cwd(), 'config');
const PIPELINE_RUNS_PATH = join(DATA_DIR, 'pipeline-runs.json');
const PIPELINE_CONFIG_PATH = join(CONFIG_DIR, 'pipeline.json');

const DEFAULT_CONFIG: PipelineConfig = {
  enabled: true,
  schedule: {
    dailyRunTime: '09:00',
    postsPerDay: 2,
    autoDiscover: true
  },
  discovery: {
    // 2차원 강화 발굴 소스 포함
    sources: ['moltbook_trending', 'gap_analysis', 'community_requests', 'openclaw_feedback', 'vote_posts'],
    minScore: 70,
    autoPopulateWhenQueueBelow: 5
  },
  validation: {
    skipFactCheck: false,
    allGates: true,
    blockOnFailure: true
  },
  moltbook: {
    sharePosts: true,
    collectFeedback: true,
    useFeedbackForDiscovery: true
  }
};

// ============================================================================
// 콘텐츠 파이프라인
// ============================================================================

export class ContentPipeline {
  private config: PipelineConfig;
  private currentRun: PipelineRun | null = null;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 전체 파이프라인 실행
   */
  async runFull(options: {
    dryRun?: boolean;
    stages?: string[];
    verbose?: boolean;
  } = {}): Promise<PipelineRun> {
    const runId = `run-${Date.now()}`;

    this.currentRun = {
      id: runId,
      startedAt: new Date().toISOString(),
      status: 'running',
      stages: [],
      summary: {
        topicsDiscovered: 0,
        topicsSelected: 0,
        postsGenerated: 0,
        postsValidated: 0,
        postsPublished: 0
      },
      errors: []
    };

    const stagesToRun = options.stages || ['discover', 'select', 'generate', 'validate', 'publish', 'monitor'];

    console.log(`\n🚀 파이프라인 시작 (${runId})\n`);

    try {
      // 1. 발굴 단계
      if (stagesToRun.includes('discover')) {
        const discoverResult = await this.runStage('discover', async () => {
          return this.stageDiscover();
        }, options.verbose);

        if (discoverResult) {
          this.currentRun.summary.topicsDiscovered = discoverResult.recommendations?.length || 0;
        }
      }

      // 2. 선택 단계
      let selectedTopics: TopicItem[] = [];
      if (stagesToRun.includes('select')) {
        const selectResult = await this.runStage('select', async () => {
          const discovery = this.getStageResult<DiscoveryResult>('discover');
          return this.stageSelect(discovery?.recommendations || []);
        }, options.verbose);

        if (selectResult) {
          selectedTopics = selectResult;
          this.currentRun.summary.topicsSelected = selectResult.length;
        }
      }

      // 3. 생성 단계
      let generatedPosts: GeneratedPost[] = [];
      if (stagesToRun.includes('generate') && !options.dryRun) {
        const generateResult = await this.runStage('generate', async () => {
          return this.stageGenerate(selectedTopics);
        }, options.verbose);

        if (generateResult) {
          generatedPosts = generateResult;
          this.currentRun.summary.postsGenerated = generateResult.filter(p => p.success).length;
        }
      }

      // 4. 검증 단계 (통합 파이프라인: Factcheck → Enhance → Quality → AEO → Image)
      let validatedPosts: { post: GeneratedPost; validation: FullValidationResult }[] = [];
      if (stagesToRun.includes('validate') && !options.dryRun) {
        const validateResult = await this.runStage('validate', async () => {
          return this.stageValidate(generatedPosts);
        }, options.verbose);

        if (validateResult) {
          validatedPosts = validateResult.filter(v => v.validation.canPublish);
          this.currentRun.summary.postsValidated = validatedPosts.length;
        }
      }

      // 5. 발행 단계
      if (stagesToRun.includes('publish') && !options.dryRun) {
        const publishResult = await this.runStage('publish', async () => {
          const postsToPublish = validatedPosts.map(v => v.post);
          return this.stagePublish(postsToPublish);
        }, options.verbose);

        if (publishResult) {
          this.currentRun.summary.postsPublished = publishResult.filter(p => p.success).length;
        }
      }

      // 6. 모니터링 단계
      if (stagesToRun.includes('monitor')) {
        await this.runStage('monitor', async () => {
          return this.stageMonitor();
        }, options.verbose);
      }

      // 완료
      this.currentRun.status = this.currentRun.errors.length > 0 ? 'partial' : 'completed';
      this.currentRun.completedAt = new Date().toISOString();

      // 실행 기록 저장
      await this.saveRun(this.currentRun);

      console.log(`\n✅ 파이프라인 완료`);
      this.printSummary();

      return this.currentRun;

    } catch (error) {
      this.currentRun.status = 'failed';
      this.currentRun.errors.push(error instanceof Error ? error.message : String(error));
      this.currentRun.completedAt = new Date().toISOString();

      await this.saveRun(this.currentRun);

      console.log(`\n❌ 파이프라인 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 단일 스테이지 실행
   */
  private async runStage<T>(
    name: string,
    executor: () => Promise<T>,
    verbose?: boolean
  ): Promise<T | null> {
    const stage: PipelineStage = {
      name,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.currentRun!.stages.push(stage);

    if (verbose) {
      console.log(`\n📌 스테이지: ${name}`);
    }

    try {
      const startTime = Date.now();
      const result = await executor();

      stage.status = 'completed';
      stage.completedAt = new Date().toISOString();
      stage.duration = Date.now() - startTime;
      stage.result = result;

      if (verbose) {
        console.log(`   ✓ 완료 (${stage.duration}ms)`);
      }

      return result;

    } catch (error) {
      stage.status = 'failed';
      stage.completedAt = new Date().toISOString();
      stage.error = error instanceof Error ? error.message : String(error);

      this.currentRun!.errors.push(`[${name}] ${stage.error}`);

      if (verbose) {
        console.log(`   ✗ 실패: ${stage.error}`);
      }

      return null;
    }
  }

  /**
   * 스테이지 결과 가져오기
   */
  private getStageResult<T>(stageName: string): T | null {
    const stage = this.currentRun?.stages.find(s => s.name === stageName);
    return (stage?.result as T) || null;
  }

  // ========================================================================
  // 스테이지 구현
  // ========================================================================

  /**
   * 발굴 스테이지
   * 2차원 강화 발굴 지원:
   * - 차원 1: OpenClaw 포스트 피드백 (openclaw_feedback)
   * - 차원 2: Vote/Poll 포스트 피드백 (vote_posts)
   */
  async stageDiscover(): Promise<DiscoveryResult> {
    const moltbookConfig = await loadMoltbookConfig();
    const discovery = new TopicDiscovery(moltbookConfig);

    // 커뮤니티 요청 수집
    let communityRequests: string[] = [];
    if (this.config.discovery.sources.includes('community_requests')) {
      const extractor = new CommunityRequestExtractor(moltbookConfig);
      const requests = await extractor.extractFromRecentFeedback(7);
      communityRequests = extractor.toRecommendationStrings(requests);
    }

    // 강화 발굴 사용 여부 확인
    const useEnhanced = this.config.discovery.sources.includes('openclaw_feedback') ||
                        this.config.discovery.sources.includes('vote_posts');

    if (useEnhanced) {
      // 2차원 강화 발굴 사용
      console.log('   🚀 2차원 강화 발굴 모드 활성화');
      const result = await discovery.discoverEnhanced({
        includeGaps: this.config.discovery.sources.includes('gap_analysis'),
        includeOpenClaw: this.config.discovery.sources.includes('openclaw_feedback'),
        includeVotePosts: this.config.discovery.sources.includes('vote_posts'),
        communityRequests
      });
      return result;
    }

    // 기본 발굴
    const result = await discovery.discover({
      includeGaps: this.config.discovery.sources.includes('gap_analysis'),
      communityRequests
    });

    return result;
  }

  /**
   * 선택 스테이지
   */
  async stageSelect(recommendations: TopicRecommendation[]): Promise<TopicItem[]> {
    // 큐 로드
    const queuePath = join(CONFIG_DIR, 'topic-queue.json');
    let queue: { queue: TopicItem[]; completed: TopicItem[]; settings: { postsPerDay: number } };

    try {
      const content = await readFile(queuePath, 'utf-8');
      queue = JSON.parse(content);
    } catch {
      queue = { queue: [], completed: [], settings: { postsPerDay: 2 } };
    }

    // 큐가 부족하면 추천에서 채우기
    const neededCount = this.config.schedule.postsPerDay;

    if (queue.queue.length < neededCount && this.config.schedule.autoDiscover) {
      const suitable = recommendations.filter(r => r.score >= this.config.discovery.minScore);

      for (const rec of suitable.slice(0, neededCount - queue.queue.length)) {
        // 중복 체크
        const exists = queue.queue.some(t => t.title === rec.suggestedTitle) ||
                      queue.completed.some(t => t.title === rec.suggestedTitle);

        if (!exists) {
          queue.queue.push({
            title: rec.suggestedTitle,
            type: rec.type
          });
        }
      }

      // 큐 저장
      await writeFile(queuePath, JSON.stringify(queue, null, 2));
    }

    // 오늘 생성할 주제 선택
    const selected = queue.queue.slice(0, neededCount);

    return selected;
  }

  /**
   * 생성 스테이지
   */
  async stageGenerate(topics: TopicItem[]): Promise<GeneratedPost[]> {
    const results: GeneratedPost[] = [];

    // 동적 임포트로 순환 참조 방지
    const { newCommand } = await import('../cli/commands/new.js');

    for (const topic of topics) {
      try {
        console.log(`   생성 중: ${topic.title}`);

        // new 명령어 시뮬레이션
        await newCommand({
          topic: topic.title,
          type: topic.type,
          length: 'medium',
          inlineImages: true,
          imageCount: 3,
          yes: true,  // 비대화 모드
          draft: true
        });

        // 생성된 파일 경로 추정 (날짜 기반)
        const today = new Date().toISOString().split('T')[0];
        const slug = topic.title.toLowerCase().replace(/[^가-힣a-z0-9]/g, '-').substring(0, 30);
        const filePath = `drafts/${today}-${slug}.md`;

        results.push({
          title: topic.title,
          type: topic.type,
          filePath,
          success: true
        });

      } catch (error) {
        results.push({
          title: topic.title,
          type: topic.type,
          filePath: '',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * 검증 스테이지 (통합 검증 파이프라인 사용)
   * 흐름: Factcheck → Enhance → Quality → AEO → Image
   */
  async stageValidate(posts: GeneratedPost[]): Promise<Array<{
    post: GeneratedPost;
    validation: FullValidationResult;
  }>> {
    const results: Array<{ post: GeneratedPost; validation: FullValidationResult }> = [];

    for (const post of posts) {
      if (!post.success || !existsSync(post.filePath)) {
        continue;
      }

      try {
        // 통합 검증 파이프라인 실행
        const validation = await runFullValidation(post.filePath, {
          mode: 'full',
          includeEnhance: true,  // 콘텐츠 향상 포함
          includeFactcheck: !this.config.validation.skipFactCheck,
          includeQuality: this.config.validation.allGates,
          includeAEO: true,
          includeImage: true,
          applyAEO: true,  // AEO 자동 적용
          verbose: false,
          onProgress: (stage, msg) => {
            console.log(`   [${stage}] ${msg}`);
          }
        });

        results.push({ post, validation });

        const avgScore = calculateAverageScore(validation.stages);
        const status = validation.canPublish ? '✓' : (validation.needsReview ? '⚠' : '✗');
        console.log(`   ${status} ${post.title}: 평균 ${avgScore}%`);

        // 단계별 결과 출력
        for (const stage of validation.stages) {
          const stageIcon = stage.status === 'passed' ? '✓' :
                           stage.status === 'warning' ? '⚠' : '✗';
          const scoreStr = stage.score !== undefined ? ` (${stage.score}%)` : '';
          console.log(`      ${stageIcon} ${stage.name}${scoreStr}`);
        }

      } catch (error) {
        console.log(`   ✗ ${post.title}: 검증 실패 - ${error}`);
      }
    }

    return results;
  }

  /**
   * 발행 스테이지
   * 드래프트 파일을 Hugo 블로그 디렉토리로 복사하고 Git 커밋/푸시
   */
  async stagePublish(posts: GeneratedPost[]): Promise<PublishResult[]> {
    const execAsync = promisify(exec);
    const results: PublishResult[] = [];
    const blogDir = join(process.cwd(), 'blog');
    const publishedFiles: string[] = [];

    for (const post of posts) {
      if (!post.success) continue;

      try {
        if (!existsSync(post.filePath)) {
          results.push({
            filePath: post.filePath,
            title: post.title,
            success: false,
            error: '파일을 찾을 수 없습니다'
          });
          continue;
        }

        // 프론트매터에서 카테고리 추출
        const content = await readFile(post.filePath, 'utf-8');
        const { data } = matter(content);
        const category = (data.categories as string[])?.[0] || post.type || 'travel';

        // 블로그 디렉토리로 복사
        const targetDir = join(blogDir, 'content', 'posts', category);
        await mkdir(targetDir, { recursive: true });
        const filename = basename(post.filePath);
        const targetPath = join(targetDir, filename);
        await copyFile(post.filePath, targetPath);
        publishedFiles.push(targetPath);

        const slug = filename.replace('.md', '');
        const blogUrl = `/posts/${category}/${slug}/`;

        results.push({
          filePath: post.filePath,
          title: post.title,
          success: true,
          blogUrl
        });

        console.log(`   발행: ${post.title} → posts/${category}/`);
      } catch (error) {
        results.push({
          filePath: post.filePath,
          title: post.title,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Git 커밋 & 푸시
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      try {
        const commitMessage = `Add ${successfulResults.length} post(s): ${successfulResults.map(r => r.title).join(', ')}`;
        await execAsync('git add blog/content/posts/', { cwd: process.cwd() });
        await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: process.cwd() });
        await execAsync('git push', { cwd: process.cwd() });
        console.log(`   Git 푸시 완료 (${successfulResults.length}개 포스트)`);
      } catch (gitError) {
        console.log(`   ⚠️ Git 작업 실패: ${gitError instanceof Error ? gitError.message : String(gitError)}`);
      }
    }

    // Moltbook 공유
    if (this.config.moltbook.sharePosts) {
      const moltbookConfig = await loadMoltbookConfig();
      if (moltbookConfig) {
        const feedbackLoop = new MoltbookFeedbackLoop(moltbookConfig);

        for (const result of successfulResults) {
          try {
            // 포스트 데이터를 읽어서 요약/토픽 추출
            const content = await readFile(result.filePath, 'utf-8');
            const { data } = matter(content);
            const category = (data.categories as string[])?.[0] || 'travel';
            const summary = data.description || data.summary || result.title;
            const topics = (data.tags as string[]) || [];

            await feedbackLoop.sharePost({
              title: result.title,
              url: result.blogUrl || '',
              summary,
              category: category as 'travel' | 'culture',
              topics
            });
            console.log(`   Moltbook 공유 완료: ${result.title}`);
          } catch (shareError) {
            console.log(`   ⚠️ Moltbook 공유 실패: ${result.title} - ${shareError instanceof Error ? shareError.message : String(shareError)}`);
          }
        }
      }
    }

    return results;
  }

  /**
   * 모니터링 스테이지
   */
  async stageMonitor(): Promise<{ report: string }> {
    // Moltbook 피드백 수집
    if (this.config.moltbook.collectFeedback) {
      const moltbookConfig = await loadMoltbookConfig();
      if (moltbookConfig) {
        const feedbackLoop = new MoltbookFeedbackLoop(moltbookConfig);
        await feedbackLoop.heartbeat();
      }
    }

    return { report: '모니터링 완료' };
  }

  // ========================================================================
  // 유틸리티
  // ========================================================================

  // calculateAvgScore는 stages.ts의 calculateAverageScore로 대체됨

  /**
   * 요약 출력
   */
  private printSummary(): void {
    if (!this.currentRun) return;

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 파이프라인 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  발굴된 주제: ${this.currentRun.summary.topicsDiscovered}개
  선택된 주제: ${this.currentRun.summary.topicsSelected}개
  생성된 포스트: ${this.currentRun.summary.postsGenerated}개
  검증 통과: ${this.currentRun.summary.postsValidated}개
  발행 완료: ${this.currentRun.summary.postsPublished}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    if (this.currentRun.errors.length > 0) {
      console.log('⚠️ 오류:');
      for (const err of this.currentRun.errors) {
        console.log(`  - ${err}`);
      }
    }
  }

  /**
   * 실행 기록 저장
   */
  private async saveRun(run: PipelineRun): Promise<void> {
    let runs: PipelineRun[] = [];

    try {
      if (existsSync(PIPELINE_RUNS_PATH)) {
        const content = await readFile(PIPELINE_RUNS_PATH, 'utf-8');
        runs = JSON.parse(content);
      }
    } catch {
      // ignore
    }

    // 최근 100개만 유지
    runs.unshift(run);
    runs = runs.slice(0, 100);

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(PIPELINE_RUNS_PATH, JSON.stringify(runs, null, 2));
  }

  /**
   * 실행 기록 로드
   */
  async loadRuns(limit: number = 10): Promise<PipelineRun[]> {
    try {
      if (!existsSync(PIPELINE_RUNS_PATH)) {
        return [];
      }

      const content = await readFile(PIPELINE_RUNS_PATH, 'utf-8');
      const runs: PipelineRun[] = JSON.parse(content);
      return runs.slice(0, limit);
    } catch {
      return [];
    }
  }
}

/**
 * 파이프라인 설정 로드
 */
export async function loadPipelineConfig(): Promise<PipelineConfig> {
  try {
    if (!existsSync(PIPELINE_CONFIG_PATH)) {
      await savePipelineConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const content = await readFile(PIPELINE_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content) as Partial<PipelineConfig>;

    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * 파이프라인 설정 저장
 */
export async function savePipelineConfig(config: PipelineConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(PIPELINE_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export default ContentPipeline;

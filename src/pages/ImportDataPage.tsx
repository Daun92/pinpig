import { useState, useRef, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  FileJson,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import {
  importExcelData,
  previewExcelImport,
  getImportStatus,
  clearAllTransactions,
  checkDuplicates,
  detectFileType,
  parseCSV,
  parseJSON,
  SUPPORTED_FILE_TYPES,
  type ExcelRow,
  type ImportPreview,
  type ImportResult,
  type ImportProgress,
  type DuplicateCheckResult,
  type SupportedFileType,
} from '@/services/excelImport';

type Step = 'upload' | 'preview' | 'duplicate_check' | 'importing' | 'complete';

export function ImportDataPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<SupportedFileType | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [clearExisting, setClearExisting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importStatus, setImportStatus] = useState<Awaited<ReturnType<typeof getImportStatus>> | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 파일 타입에 따른 아이콘
  const getFileIcon = (type: SupportedFileType | null, size = 48) => {
    const className = 'text-ink-mid';
    switch (type) {
      case 'csv':
        return <FileText size={size} className={className} />;
      case 'json':
        return <FileJson size={size} className={className} />;
      default:
        return <FileSpreadsheet size={size} className={className} />;
    }
  };

  // 파일 처리 공통 함수
  const processFile = async (file: File) => {
    setError('');
    setFileName(file.name);

    const detectedType = detectFileType(file.name);
    if (!detectedType) {
      setError('지원하지 않는 파일 형식입니다. xlsx, xls, csv, json 파일만 가능합니다.');
      return;
    }

    setFileType(detectedType);

    try {
      let jsonData: ExcelRow[] = [];

      if (detectedType === 'xlsx' || detectedType === 'xls') {
        // Excel 파일 처리
        const XLSX = await import('xlsx');
        const reader = new FileReader();

        const result = await new Promise<ExcelRow[]>((resolve, reject) => {
          reader.onload = (event) => {
            try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const parsed: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
              resolve(parsed);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error('파일 읽기 실패'));
          reader.readAsBinaryString(file);
        });

        jsonData = result;
      } else if (detectedType === 'csv') {
        // CSV 파일 처리
        const text = await file.text();
        jsonData = parseCSV(text);
      } else if (detectedType === 'json') {
        // JSON 파일 처리
        const text = await file.text();
        jsonData = parseJSON(text);
      }

      if (jsonData.length === 0) {
        setError('파일에서 데이터를 찾을 수 없습니다. 파일 형식을 확인해주세요.');
        return;
      }

      setExcelData(jsonData);

      // 미리보기 생성
      const previewData = await previewExcelImport(jsonData);
      setPreview(previewData);

      // 현재 상태 조회
      const status = await getImportStatus();
      setImportStatus(status);

      setStep('preview');
    } catch (err) {
      console.error('파일 처리 오류:', err);
      setError('파일을 처리할 수 없습니다. 올바른 형식인지 확인해주세요.');
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // 드래그앤드롭 핸들러
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // 중복 확인
  const handleCheckDuplicates = async () => {
    if (excelData.length === 0 || clearExisting) {
      handleImport();
      return;
    }

    setStep('duplicate_check');
    setError('');

    try {
      const duplicates = await checkDuplicates(excelData, setProgress);
      setDuplicateResult(duplicates);

      if (duplicates.duplicateCount === 0) {
        handleImport();
      }
    } catch (err) {
      console.error('중복 확인 오류:', err);
      setError('중복 확인 중 오류가 발생했습니다.');
      setStep('preview');
    }
  };

  // 가져오기 실행
  const handleImport = useCallback(async () => {
    if (excelData.length === 0) return;

    abortControllerRef.current = new AbortController();

    setStep('importing');
    setError('');
    setProgress(null);

    try {
      const importResult = await importExcelData(
        excelData,
        {
          clearExisting,
          createMissingCategories: true,
          createMissingPaymentMethods: true,
          skipDuplicates,
          abortSignal: abortControllerRef.current.signal,
        },
        setProgress
      );

      setResult(importResult);
      setStep('complete');
    } catch (err) {
      console.error('가져오기 오류:', err);
      setError('가져오기 중 오류가 발생했습니다: ' + (err as Error).message);
      setStep('preview');
    } finally {
      abortControllerRef.current = null;
    }
  }, [excelData, clearExisting, skipDuplicates]);

  // 가져오기 취소
  const handleCancelImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 기존 데이터 삭제
  const handleClearExisting = async () => {
    if (!window.confirm('모든 기존 거래 데이터가 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      await clearAllTransactions();
      const status = await getImportStatus();
      setImportStatus(status);
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  // 초기화
  const resetState = () => {
    setStep('upload');
    setExcelData([]);
    setPreview(null);
    setFileName('');
    setFileType(null);
    setDuplicateResult(null);
    setError('');
  };

  // 날짜 포맷
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 진행률 퍼센트 계산
  const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-paper-mid">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black ml-2">데이터 가져오기</h1>
      </header>

      <div className="px-6 py-6">
        {/* Step 1: 파일 업로드 */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="flex justify-center gap-4 mb-4">
                <FileSpreadsheet size={32} className="text-ink-mid" />
                <FileText size={32} className="text-ink-mid" />
                <FileJson size={32} className="text-ink-mid" />
              </div>
              <h2 className="text-title text-ink-black mb-2">파일 업로드</h2>
              <p className="text-body text-ink-mid">다른 가계부 앱에서 내보낸 파일을 선택하세요</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 드래그앤드롭 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-10 border-2 border-dashed rounded-md flex flex-col items-center gap-3 cursor-pointer transition-all ${
                isDragging
                  ? 'border-ink-black bg-paper-light'
                  : 'border-paper-mid hover:border-ink-mid'
              }`}
            >
              <Upload size={28} className={isDragging ? 'text-ink-black' : 'text-ink-mid'} />
              <div className="text-center">
                <span className="text-body text-ink-black block">
                  {isDragging ? '여기에 놓으세요' : '클릭하거나 파일을 드래그하세요'}
                </span>
                <span className="text-caption text-ink-light mt-1 block">Excel, CSV, JSON 지원</span>
              </div>
            </div>

            {/* 지원 형식 */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SUPPORTED_FILE_TYPES).map(([key, info]) => (
                <div key={key} className="p-3 bg-paper-light rounded-md flex items-center gap-3">
                  {key === 'csv' ? (
                    <FileText size={20} className="text-ink-mid" />
                  ) : key === 'json' ? (
                    <FileJson size={20} className="text-ink-mid" />
                  ) : (
                    <FileSpreadsheet size={20} className="text-ink-mid" />
                  )}
                  <div>
                    <p className="text-sub text-ink-black">{info.label}</p>
                    <p className="text-caption text-ink-light">{info.extension}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-paper-light rounded-md flex items-start gap-3">
                <AlertCircle size={20} className="text-ink-mid shrink-0 mt-0.5" />
                <p className="text-body text-ink-dark">{error}</p>
              </div>
            )}

            <div className="bg-paper-light rounded-md p-4">
              <h3 className="text-sub text-ink-mid mb-2">지원 앱 / 형식</h3>
              <ul className="text-caption text-ink-light space-y-1">
                <li>- 머니매니저 (Money Manager) - Excel</li>
                <li>- PinPig 내보내기 파일 - JSON</li>
                <li>- 범용 CSV (날짜, 금액, 카테고리, 내용 컬럼)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: 미리보기 */}
        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div className="bg-paper-light rounded-md p-4 flex items-start gap-4">
              {getFileIcon(fileType, 40)}
              <div className="flex-1 min-w-0">
                <h3 className="text-title text-ink-black truncate">{fileName}</h3>
                <p className="text-body text-ink-mid">
                  {preview.totalRows.toLocaleString()}개의 거래 데이터
                </p>
                {preview.dateRange.oldest && preview.dateRange.newest && (
                  <p className="text-caption text-ink-light mt-1">
                    {formatDate(preview.dateRange.oldest)} ~ {formatDate(preview.dateRange.newest)}
                  </p>
                )}
              </div>
            </div>

            {/* 현재 데이터 현황 */}
            {importStatus && importStatus.totalTransactions > 0 && (
              <div className="bg-paper-light rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sub text-ink-mid">현재 저장된 데이터</h4>
                    <p className="text-body text-ink-black">
                      {importStatus.totalTransactions.toLocaleString()}개의 거래
                    </p>
                  </div>
                  <button
                    onClick={handleClearExisting}
                    className="p-2 text-ink-mid hover:bg-paper-mid rounded-md"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => {
                        setClearExisting(e.target.checked);
                        if (e.target.checked) setSkipDuplicates(false);
                      }}
                      className="w-4 h-4 rounded border-ink-light text-ink-black focus:ring-ink-mid"
                    />
                    <span className="text-caption text-ink-mid">기존 데이터 모두 삭제 후 가져오기</span>
                  </label>

                  {!clearExisting && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="w-4 h-4 rounded border-ink-light text-ink-black focus:ring-ink-mid"
                      />
                      <span className="text-caption text-ink-mid">중복 데이터 자동 건너뛰기</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* 카테고리 목록 */}
            <div>
              <h4 className="text-sub text-ink-mid mb-2">카테고리 ({preview.categories.length}개)</h4>
              <div className="flex flex-wrap gap-2">
                {preview.categories.slice(0, 15).map((cat) => (
                  <span
                    key={cat.name}
                    className={`px-3 py-1 rounded-full text-caption ${
                      cat.type === 'income'
                        ? 'bg-money-green/10 text-money-green'
                        : 'bg-paper-light text-ink-mid'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </span>
                ))}
                {preview.categories.length > 15 && (
                  <span className="px-3 py-1 text-caption text-ink-light">
                    +{preview.categories.length - 15}개 더
                  </span>
                )}
              </div>
            </div>

            {/* 결제수단 목록 */}
            {preview.paymentMethods.length > 0 && (
              <div>
                <h4 className="text-sub text-ink-mid mb-2">
                  결제수단 ({preview.paymentMethods.length}개)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {preview.paymentMethods.slice(0, 10).map((pm) => (
                    <span
                      key={pm.name}
                      className="px-3 py-1 rounded-full bg-paper-light text-caption text-ink-mid"
                    >
                      {pm.name} ({pm.count})
                    </span>
                  ))}
                  {preview.paymentMethods.length > 10 && (
                    <span className="px-3 py-1 text-caption text-ink-light">
                      +{preview.paymentMethods.length - 10}개 더
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 샘플 데이터 */}
            <div>
              <h4 className="text-sub text-ink-mid mb-2">샘플 데이터</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.sampleTransactions.map((tx, i) => (
                  <div
                    key={i}
                    className="p-3 bg-paper-light rounded-md flex justify-between items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-caption text-ink-light">{tx.date}</p>
                      <p className="text-body text-ink-black truncate">
                        {tx.description || tx.category}
                      </p>
                      <p className="text-caption text-ink-mid">
                        {tx.category} {tx.paymentMethod && `| ${tx.paymentMethod}`}
                      </p>
                    </div>
                    <span
                      className={`text-body font-medium ml-2 shrink-0 ${
                        tx.type === '수입' || tx.type === 'income'
                          ? 'text-money-green'
                          : 'text-ink-black'
                      }`}
                    >
                      {tx.type === '수입' || tx.type === 'income' ? '+' : ''}
                      {tx.amount.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-paper-light rounded-md flex items-start gap-3">
                <AlertCircle size={20} className="text-ink-mid shrink-0 mt-0.5" />
                <p className="text-body text-ink-dark">{error}</p>
              </div>
            )}

            <div className="h-20" />
          </div>
        )}

        {/* 미리보기 액션 버튼 */}
        {step === 'preview' && preview && (
          <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-paper-white border-t border-paper-mid">
            <div className="flex gap-3 max-w-lg mx-auto">
              <button
                onClick={resetState}
                className="flex-1 py-3 rounded-sm border border-paper-mid text-ink-mid"
              >
                다시 선택
              </button>
              <button
                onClick={handleCheckDuplicates}
                className="flex-1 py-3 rounded-sm bg-ink-black text-paper-white font-medium"
              >
                가져오기
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 중복 확인 결과 */}
        {step === 'duplicate_check' && duplicateResult && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-paper-light mx-auto flex items-center justify-center mb-4">
                <Copy size={28} className="text-ink-mid" />
              </div>
              <h2 className="text-title text-ink-black mb-2">중복 데이터 발견</h2>
              <p className="text-body text-ink-mid">
                {duplicateResult.duplicateCount.toLocaleString()}개의 중복 거래가 있습니다
              </p>
            </div>

            <div className="bg-paper-light rounded-md p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">전체 데이터</span>
                <span className="text-body text-ink-black font-medium">
                  {duplicateResult.totalRows.toLocaleString()}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">중복 데이터</span>
                <span className="text-body text-ink-mid">
                  {duplicateResult.duplicateCount.toLocaleString()}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">새 데이터</span>
                <span className="text-body text-money-green font-medium">
                  {duplicateResult.newCount.toLocaleString()}개
                </span>
              </div>
            </div>

            {duplicateResult.duplicates.length > 0 && (
              <div>
                <h4 className="text-sub text-ink-mid mb-2">중복 데이터 예시</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {duplicateResult.duplicates.map((dup, i) => (
                    <div
                      key={i}
                      className="p-3 bg-paper-light rounded-md flex justify-between items-center"
                    >
                      <div>
                        <p className="text-caption text-ink-light">{dup.date}</p>
                        <p className="text-body text-ink-black">{dup.description || dup.category}</p>
                      </div>
                      <span className="text-body text-ink-mid">{dup.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSkipDuplicates(true);
                  handleImport();
                }}
                className="w-full py-3 rounded-sm bg-ink-black text-paper-white font-medium"
              >
                새 데이터만 가져오기 ({duplicateResult.newCount.toLocaleString()}개)
              </button>
              <button
                onClick={() => {
                  setSkipDuplicates(false);
                  handleImport();
                }}
                className="w-full py-3 rounded-sm border border-paper-mid text-ink-mid"
              >
                전체 가져오기 (중복 포함)
              </button>
              <button
                onClick={() => {
                  setStep('preview');
                  setDuplicateResult(null);
                }}
                className="w-full py-3 rounded-sm text-ink-light"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 가져오는 중 */}
        {step === 'importing' && (
          <div className="text-center py-16 space-y-6">
            <Loader2 size={40} className="mx-auto text-ink-mid animate-spin" />
            <div>
              <h2 className="text-title text-ink-black mb-2">데이터 가져오는 중...</h2>
              <p className="text-body text-ink-mid">
                {progress?.message ||
                  `${excelData.length.toLocaleString()}개의 거래를 처리하고 있습니다`}
              </p>
            </div>

            {progress && (
              <div className="max-w-sm mx-auto">
                <div className="flex justify-between text-caption text-ink-mid mb-2">
                  <span>{progress.phase === 'importing' ? '가져오기' : '준비'}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-0.5 bg-paper-mid rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ink-black transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {progress.phase === 'importing' && (
                  <p className="text-caption text-ink-light mt-2">
                    {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCancelImport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-paper-mid text-ink-mid hover:bg-paper-light transition-colors"
            >
              <X size={16} />
              <span>취소</span>
            </button>
          </div>
        )}

        {/* Step 5: 완료 */}
        {step === 'complete' && result && (
          <div className="space-y-6">
            <div className="text-center py-8">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-money-green/10 mx-auto flex items-center justify-center mb-4">
                    <Check size={28} className="text-money-green" />
                  </div>
                  <h2 className="text-title text-ink-black mb-2">가져오기 완료</h2>
                </>
              ) : result.errors.some((e) => e.includes('취소')) ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-paper-light mx-auto flex items-center justify-center mb-4">
                    <AlertTriangle size={28} className="text-ink-mid" />
                  </div>
                  <h2 className="text-title text-ink-black mb-2">가져오기 취소됨</h2>
                  <p className="text-body text-ink-mid">일부 데이터가 가져와졌을 수 있습니다</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-paper-light mx-auto flex items-center justify-center mb-4">
                    <AlertCircle size={28} className="text-ink-mid" />
                  </div>
                  <h2 className="text-title text-ink-black mb-2">가져오기 실패</h2>
                </>
              )}
            </div>

            <div className="bg-paper-light rounded-md p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">가져온 거래</span>
                <span className="text-body text-ink-black font-medium">
                  {result.importedTransactions.toLocaleString()}개
                </span>
              </div>
              {result.duplicateRows > 0 && (
                <div className="flex justify-between">
                  <span className="text-body text-ink-mid">건너뛴 중복</span>
                  <span className="text-body text-ink-mid">
                    {result.duplicateRows.toLocaleString()}개
                  </span>
                </div>
              )}
              {result.newCategories > 0 && (
                <div className="flex justify-between">
                  <span className="text-body text-ink-mid">새 카테고리</span>
                  <span className="text-body text-ink-black font-medium">{result.newCategories}개</span>
                </div>
              )}
              {result.newPaymentMethods > 0 && (
                <div className="flex justify-between">
                  <span className="text-body text-ink-mid">새 결제수단</span>
                  <span className="text-body text-ink-black font-medium">
                    {result.newPaymentMethods}개
                  </span>
                </div>
              )}
              {result.skippedRows > 0 && (
                <div className="flex justify-between">
                  <span className="text-body text-ink-mid">건너뛴 행</span>
                  <span className="text-body text-ink-mid">{result.skippedRows}개</span>
                </div>
              )}
              {result.dateRange.oldest && result.dateRange.newest && (
                <div className="pt-2 border-t border-paper-mid">
                  <p className="text-caption text-ink-light">
                    {formatDate(result.dateRange.oldest)} ~ {formatDate(result.dateRange.newest)}
                  </p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && !result.errors.every((e) => e.includes('취소')) && (
              <div className="bg-paper-light rounded-md p-4">
                <h4 className="text-sub text-ink-mid mb-2">오류 목록</h4>
                <ul className="text-caption text-ink-light space-y-1 max-h-32 overflow-y-auto">
                  {result.errors
                    .filter((e) => !e.includes('취소'))
                    .slice(0, 10)
                    .map((err, i) => (
                      <li key={i}>- {err}</li>
                    ))}
                  {result.errors.filter((e) => !e.includes('취소')).length > 10 && (
                    <li>... 외 {result.errors.filter((e) => !e.includes('취소')).length - 10}개</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-sm bg-ink-black text-paper-white font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

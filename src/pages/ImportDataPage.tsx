import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import {
  importExcelData,
  previewExcelImport,
  getImportStatus,
  clearAllTransactions,
  type ExcelRow,
  type ImportPreview,
  type ImportResult,
} from '@/services/excelImport';

type Step = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportDataPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [clearExisting, setClearExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<Awaited<ReturnType<typeof getImportStatus>> | null>(null);

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);

    try {
      // xlsx 라이브러리 동적 로드
      const XLSX = await import('xlsx');

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // 첫 번째 시트 파싱
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

          setExcelData(jsonData);

          // 미리보기 생성
          const previewData = await previewExcelImport(jsonData);
          setPreview(previewData);

          // 현재 상태 조회
          const status = await getImportStatus();
          setImportStatus(status);

          setStep('preview');
        } catch (err) {
          console.error('파싱 오류:', err);
          setError('파일을 읽을 수 없습니다. 올바른 Excel 파일인지 확인해주세요.');
        }
      };

      reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      console.error('Excel 처리 오류:', err);
      setError('Excel 파일 처리 중 오류가 발생했습니다.');
    }
  };

  // 가져오기 실행
  const handleImport = async () => {
    if (excelData.length === 0) return;

    setStep('importing');
    setError('');

    try {
      const importResult = await importExcelData(excelData, {
        clearExisting,
        createMissingCategories: true,
        createMissingPaymentMethods: true,
      });

      setResult(importResult);
      setStep('complete');
    } catch (err) {
      console.error('가져오기 오류:', err);
      setError('가져오기 중 오류가 발생했습니다: ' + (err as Error).message);
      setStep('preview');
    }
  };

  // 기존 데이터 삭제
  const handleClearExisting = async () => {
    if (!window.confirm('모든 기존 거래 데이터가 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      await clearAllTransactions();
      const status = await getImportStatus();
      setImportStatus(status);
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
    }
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
            <div className="text-center py-8">
              <FileSpreadsheet size={64} className="mx-auto text-ink-light mb-4" />
              <h2 className="text-heading text-ink-black mb-2">Excel 파일 업로드</h2>
              <p className="text-body text-ink-mid">
                다른 가계부 앱에서 내보낸 Excel 파일을 선택하세요
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-ink-light rounded-xl flex flex-col items-center gap-2 hover:border-pig-pink transition-colors"
            >
              <Upload size={24} className="text-ink-mid" />
              <span className="text-body text-ink-mid">파일 선택</span>
              <span className="text-caption text-ink-light">.xlsx, .xls</span>
            </button>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-body text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-paper-light dark:bg-paper-dark rounded-lg p-4">
              <h3 className="text-sub text-ink-mid mb-2">지원 형식</h3>
              <ul className="text-caption text-ink-light space-y-1">
                <li>- 머니매니저 (Money Manager)</li>
                <li>- 기간, 자산, 분류, 내용, 금액 컬럼 필요</li>
                <li>- 첫 번째 시트의 데이터만 가져옵니다</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: 미리보기 */}
        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div className="bg-pig-pink/10 dark:bg-pig-pink/20 rounded-lg p-4">
              <h3 className="text-heading text-ink-black mb-1">{fileName}</h3>
              <p className="text-body text-ink-mid">
                {preview.totalRows.toLocaleString()}개의 거래 데이터
              </p>
              {preview.dateRange.oldest && preview.dateRange.newest && (
                <p className="text-caption text-ink-light mt-1">
                  {formatDate(preview.dateRange.oldest)} ~ {formatDate(preview.dateRange.newest)}
                </p>
              )}
            </div>

            {/* 현재 데이터 현황 */}
            {importStatus && importStatus.totalTransactions > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sub text-amber-700 dark:text-amber-400">현재 저장된 데이터</h4>
                    <p className="text-body text-amber-600 dark:text-amber-300">
                      {importStatus.totalTransactions.toLocaleString()}개의 거래
                    </p>
                  </div>
                  <button
                    onClick={handleClearExisting}
                    className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-400 text-pig-pink focus:ring-pig-pink"
                  />
                  <span className="text-caption text-amber-600 dark:text-amber-300">
                    가져오기 전 기존 데이터 삭제
                  </span>
                </label>
              </div>
            )}

            {/* 카테고리 목록 */}
            <div>
              <h4 className="text-sub text-ink-mid mb-2">
                카테고리 ({preview.categories.length}개)
              </h4>
              <div className="flex flex-wrap gap-2">
                {preview.categories.slice(0, 15).map((cat) => (
                  <span
                    key={cat.name}
                    className={`px-3 py-1 rounded-full text-caption ${
                      cat.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-paper-light dark:bg-paper-dark text-ink-mid'
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
            <div>
              <h4 className="text-sub text-ink-mid mb-2">
                결제수단 ({preview.paymentMethods.length}개)
              </h4>
              <div className="flex flex-wrap gap-2">
                {preview.paymentMethods.slice(0, 10).map((pm) => (
                  <span
                    key={pm.name}
                    className="px-3 py-1 rounded-full bg-paper-light dark:bg-paper-dark text-caption text-ink-mid"
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

            {/* 샘플 데이터 */}
            <div>
              <h4 className="text-sub text-ink-mid mb-2">샘플 데이터</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.sampleTransactions.map((tx, i) => (
                  <div
                    key={i}
                    className="p-3 bg-paper-light dark:bg-paper-dark rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-caption text-ink-light">{tx.date}</p>
                      <p className="text-body text-ink-black">{tx.description || tx.category}</p>
                      <p className="text-caption text-ink-mid">
                        {tx.category} | {tx.paymentMethod}
                      </p>
                    </div>
                    <span
                      className={`text-body font-medium ${
                        tx.type === '수입' ? 'text-money-green' : 'text-ink-black'
                      }`}
                    >
                      {tx.type === '수입' ? '+' : ''}
                      {tx.amount.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-body text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* 하단 여백 (고정 버튼 공간) */}
            <div className="h-20" />
          </div>
        )}

        {/* 미리보기 액션 버튼 - 하단 고정 */}
        {step === 'preview' && preview && (
          <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-paper-white dark:bg-ink-black border-t border-paper-mid">
            <div className="flex gap-3 max-w-lg mx-auto">
              <button
                onClick={() => {
                  setStep('upload');
                  setExcelData([]);
                  setPreview(null);
                  setFileName('');
                }}
                className="flex-1 py-3 rounded-xl border border-ink-light text-ink-mid"
              >
                다시 선택
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-3 rounded-xl bg-pig-pink text-white font-medium"
              >
                가져오기
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 가져오는 중 */}
        {step === 'importing' && (
          <div className="text-center py-16">
            <Loader2 size={48} className="mx-auto text-pig-pink animate-spin mb-4" />
            <h2 className="text-heading text-ink-black mb-2">데이터 가져오는 중...</h2>
            <p className="text-body text-ink-mid">
              {excelData.length.toLocaleString()}개의 거래를 처리하고 있습니다
            </p>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'complete' && result && (
          <div className="space-y-6">
            <div className="text-center py-8">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-4">
                    <Check size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-heading text-ink-black mb-2">가져오기 완료!</h2>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-heading text-ink-black mb-2">가져오기 실패</h2>
                </>
              )}
            </div>

            <div className="bg-paper-light dark:bg-paper-dark rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-ink-mid">가져온 거래</span>
                <span className="text-body text-ink-black font-medium">
                  {result.importedTransactions.toLocaleString()}개
                </span>
              </div>
              {result.newCategories > 0 && (
                <div className="flex justify-between">
                  <span className="text-body text-ink-mid">새 카테고리</span>
                  <span className="text-body text-ink-black font-medium">
                    {result.newCategories}개
                  </span>
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
                  <span className="text-body text-amber-600">
                    {result.skippedRows}개
                  </span>
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

            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h4 className="text-sub text-red-600 dark:text-red-400 mb-2">오류 목록</h4>
                <ul className="text-caption text-red-500 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>- {err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... 외 {result.errors.length - 10}개</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-pig-pink text-white font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

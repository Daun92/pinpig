import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileSpreadsheet, Database, Check, FileJson } from 'lucide-react';
import {
  exportTransactionsToCSV,
  exportCategoriesToCSV,
  exportPaymentMethodsToCSV,
  exportAllDataToJSON,
  getExportPreview,
} from '@/services/exportData';
import type { Transaction } from '@/types';
import { db } from '@/services/database';

type ExportType = 'transactions' | 'categories' | 'paymentMethods' | 'backup';

interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

export function ExportDataPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ExportType>('transactions');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 미리보기 데이터
  const [preview, setPreview] = useState<{
    transactions: Transaction[];
    totalCount: number;
    dateRange: { oldest: Date | null; newest: Date | null };
  } | null>(null);
  const [categoryCount, setCategoryCount] = useState(0);
  const [paymentMethodCount, setPaymentMethodCount] = useState(0);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());

  const exportOptions: ExportOption[] = [
    {
      id: 'transactions',
      name: '거래 내역',
      description: '모든 수입/지출 기록을 CSV로 내보내기',
      icon: <FileSpreadsheet size={24} className="text-accent-blue" />,
      format: 'CSV',
    },
    {
      id: 'categories',
      name: '카테고리',
      description: '카테고리 설정을 CSV로 내보내기',
      icon: <FileSpreadsheet size={24} className="text-accent-green" />,
      format: 'CSV',
    },
    {
      id: 'paymentMethods',
      name: '결제수단',
      description: '결제수단 설정을 CSV로 내보내기',
      icon: <FileSpreadsheet size={24} className="text-accent-purple" />,
      format: 'CSV',
    },
    {
      id: 'backup',
      name: '전체 백업',
      description: '모든 데이터를 JSON으로 백업',
      icon: <FileJson size={24} className="text-accent-orange" />,
      format: 'JSON',
    },
  ];

  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    const previewData = await getExportPreview();
    setPreview(previewData);

    const cats = await db.categories.toArray();
    setCategoryCount(cats.length);
    const catMap = new Map<string, string>();
    cats.forEach(c => catMap.set(c.id, c.name));
    setCategories(catMap);

    const pms = await db.paymentMethods.count();
    setPaymentMethodCount(pms);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    let result;
    switch (selectedType) {
      case 'transactions':
        result = await exportTransactionsToCSV();
        break;
      case 'categories':
        result = await exportCategoriesToCSV();
        break;
      case 'paymentMethods':
        result = await exportPaymentMethodsToCSV();
        break;
      case 'backup':
        result = await exportAllDataToJSON();
        break;
    }

    setIsExporting(false);

    if (result.success) {
      setExportResult({
        success: true,
        message: `${result.recordCount.toLocaleString()}건 내보내기 완료\n파일명: ${result.filename}`,
      });
    } else {
      setExportResult({
        success: false,
        message: `내보내기 실패: ${result.error}`,
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  return (
    <div className="min-h-screen bg-paper-white pb-nav">
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-paper-mid">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-ink-black" />
        </button>
        <h1 className="text-title text-ink-black ml-2">데이터 내보내기</h1>
      </header>

      <div className="px-5 py-6">
        {/* Export Type Selection */}
        <section className="mb-6">
          <h2 className="text-sub text-ink-light mb-3">내보낼 데이터 선택</h2>
          <div className="space-y-2">
            {exportOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedType(option.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selectedType === option.id
                    ? 'border-accent-blue bg-accent-blue/5'
                    : 'border-paper-mid bg-paper-light'
                }`}
              >
                <div className="flex-shrink-0">{option.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-body text-ink-black font-medium">{option.name}</span>
                    <span className="text-caption text-ink-light px-2 py-0.5 bg-paper-mid rounded">
                      {option.format}
                    </span>
                  </div>
                  <p className="text-caption text-ink-mid mt-0.5">{option.description}</p>
                </div>
                {selectedType === option.id && (
                  <Check size={20} className="text-accent-blue flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Preview Section */}
        {selectedType === 'transactions' && preview && (
          <section className="mb-6">
            <h2 className="text-sub text-ink-light mb-3">내보내기 미리보기</h2>
            <div className="bg-paper-light rounded-xl p-4">
              {/* Summary */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-paper-mid">
                <div>
                  <p className="text-body text-ink-black font-medium">
                    총 {preview.totalCount.toLocaleString()}건
                  </p>
                  <p className="text-caption text-ink-mid mt-0.5">
                    {formatDate(preview.dateRange.oldest)} ~ {formatDate(preview.dateRange.newest)}
                  </p>
                </div>
                <Database size={20} className="text-ink-light" />
              </div>

              {/* Sample Data */}
              {preview.transactions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-caption text-ink-light mb-2">최근 거래 샘플</p>
                  {preview.transactions.slice(0, 5).map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-paper-mid last:border-0"
                    >
                      <div>
                        <p className="text-sub text-ink-black">
                          {categories.get(tx.categoryId) || '기타'}
                        </p>
                        <p className="text-caption text-ink-light">
                          {new Date(tx.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <p
                        className={`text-sub font-medium ${
                          tx.type === 'income' ? 'text-accent-green' : 'text-ink-black'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : ''}
                        {formatAmount(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-ink-light py-4">내보낼 데이터가 없습니다</p>
              )}
            </div>
          </section>
        )}

        {selectedType === 'categories' && (
          <section className="mb-6">
            <h2 className="text-sub text-ink-light mb-3">내보내기 정보</h2>
            <div className="bg-paper-light rounded-xl p-4">
              <p className="text-body text-ink-black">
                총 {categoryCount.toLocaleString()}개의 카테고리
              </p>
              <p className="text-caption text-ink-mid mt-1">
                이름, 유형, 아이콘, 색상, 예산, 순서 정보가 포함됩니다
              </p>
            </div>
          </section>
        )}

        {selectedType === 'paymentMethods' && (
          <section className="mb-6">
            <h2 className="text-sub text-ink-light mb-3">내보내기 정보</h2>
            <div className="bg-paper-light rounded-xl p-4">
              <p className="text-body text-ink-black">
                총 {paymentMethodCount.toLocaleString()}개의 결제수단
              </p>
              <p className="text-caption text-ink-mid mt-1">
                이름, 아이콘, 색상, 순서 정보가 포함됩니다
              </p>
            </div>
          </section>
        )}

        {selectedType === 'backup' && (
          <section className="mb-6">
            <h2 className="text-sub text-ink-light mb-3">백업 정보</h2>
            <div className="bg-paper-light rounded-xl p-4">
              <p className="text-body text-ink-black">전체 데이터 백업</p>
              <p className="text-caption text-ink-mid mt-1">
                거래 내역, 카테고리, 결제수단, 설정, 반복 거래가 모두 포함됩니다
              </p>
              <p className="text-caption text-accent-orange mt-2">
                JSON 형식으로 저장되며, 추후 복원 기능에서 사용할 수 있습니다
              </p>
            </div>
          </section>
        )}

        {/* Export Result */}
        {exportResult && (
          <section className="mb-6">
            <div
              className={`rounded-xl p-4 ${
                exportResult.success ? 'bg-accent-green/10' : 'bg-red-50'
              }`}
            >
              <p
                className={`text-body whitespace-pre-line ${
                  exportResult.success ? 'text-accent-green' : 'text-red-500'
                }`}
              >
                {exportResult.message}
              </p>
            </div>
          </section>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || (selectedType === 'transactions' && preview?.totalCount === 0)}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-body font-medium transition-all ${
            isExporting || (selectedType === 'transactions' && preview?.totalCount === 0)
              ? 'bg-paper-mid text-ink-light cursor-not-allowed'
              : 'bg-ink-black text-paper-white active:bg-ink-dark'
          }`}
        >
          <Download size={20} />
          {isExporting ? '내보내는 중...' : '내보내기'}
        </button>

        {/* Info */}
        <p className="text-caption text-ink-light text-center mt-4">
          CSV 파일은 Excel, Google Sheets 등에서 열 수 있습니다
        </p>
      </div>
    </div>
  );
}

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages if there are not too many
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - halfPagesToShow);
      let end = Math.min(totalPages - 1, currentPage + halfPagesToShow);

      if (currentPage - halfPagesToShow <= 2) {
        end = maxPagesToShow;
      }
      
      if (currentPage + halfPagesToShow >= totalPages - 1) {
        start = totalPages - (maxPagesToShow -1);
      }

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Show last page
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center space-x-1">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
        </li>
        {pages.map((page, index) => (
          <li key={index}>
            {typeof page === 'number' ? (
              <button
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ) : (
              <span className="px-3 py-1 text-sm text-gray-500">
                {page}
              </span>
            )}
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;

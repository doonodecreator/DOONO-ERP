import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Books() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Textbook', total_copies: 5, shelf_location: '' });

  useEffect(() => {
    loadLibraryData();
  }, [activeTab]);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'catalog') {
        const res = await api.get('/books');
        const data = res.data.data || res.data || [];
        setBooks(Array.isArray(data) ? data : []);
      } else {
        const res = await api.get('/book-loans');
        const data = res.data.data || res.data || [];
        setLoans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch library records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', bookForm);
      setMessage('Book added to library catalog successfully!');
      setShowBookModal(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'Textbook', total_copies: 5, shelf_location: '' });
      loadLibraryData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add book.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Library & Book Inventory</h1>
          <p className="text-sm text-gray-500">Manage book catalogs, textbook inventories, and student borrowing loans.</p>
        </div>
        {activeTab === 'catalog' && (
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
          >
            + Add Book to Catalog
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadLibraryData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'catalog' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'loans' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Loans ({loans.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading library inventory...</div>
        ) : activeTab === 'catalog' ? (
          books.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No books found in catalog. Click "+ Add Book to Catalog".</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Author</th>
                    <th className="px-6 py-3">ISBN</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Total Copies</th>
                    <th className="px-6 py-3">Shelf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{b.title}</td>
                      <td className="px-6 py-4">{b.author || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{b.isbn || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700">
                          {b.category || 'Textbook'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">{b.total_copies || 1}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{b.shelf_location || 'General'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          loans.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No active book loans recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Book Title</th>
                    <th className="px-6 py-3">Borrower</th>
                    <th className="px-6 py-3">Borrow Date</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loans.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{l.book?.title || 'Book #' + l.book_id}</td>
                      <td className="px-6 py-4">{l.student?.full_name || 'Student #' + l.student_id}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{l.borrow_date || '—'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-red-600">{l.due_date || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          l.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {l.status || 'Borrowed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Book to Catalog</h3>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="e.g. Comprehensive Mathematics for SS3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Author *</label>
                <input
                  type="text"
                  required
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="e.g. J. A. Olowookere"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    placeholder="ISBN-13"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Copies</label>
                  <input
                    type="number"
                    value={bookForm.total_copies}
                    onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

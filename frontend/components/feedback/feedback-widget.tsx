'use client';

import { useState } from 'react';
import { MessageSquare, X, Star } from 'lucide-react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          rating,
          message,
          context: {
            page: window.location.pathname,
            timestamp: Date.now()
          }
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setMessage('');
          setRating(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
  };

  return (
    <>
      {/* Feedback Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 lg:bottom-4 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Give Feedback"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {submitted ? 'Thank You! 🎉' : 'Share Your Feedback'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-6xl mb-4">✓</div>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Your feedback helps us improve!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="usability">Usability</option>
                    <option value="functionality">Functionality</option>
                    <option value="performance">Performance</option>
                    <option value="aesthetics">Design/Aesthetics</option>
                    <option value="security">Security</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rate Your Experience
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tell Us More
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="What can we improve?"
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!rating || !message}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Submit Feedback
                </button>
              </form>
            )}

            {/* Privacy Note */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Your feedback is anonymous and helps us improve BitCurrent
            </p>
          </div>
        </div>
      )}
    </>
  );
}


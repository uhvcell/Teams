import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { AnonymousFeedback } from '../types';
import { MessageSquare, Star, Send, ShieldAlert, CheckCircle2, HeartHandshake, Sparkles } from 'lucide-react';

export const StudentFeedbackView: React.FC = () => {
  const [category, setCategory] = useState<AnonymousFeedback['category']>('Workshop');
  const [rating, setRating] = useState<number>(5);
  const [workshopTopic, setWorkshopTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>(() => storageService.getFeedbacks());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newItem = storageService.submitAnonymousFeedback({
      category,
      rating,
      workshopTopic: workshopTopic.trim() || undefined,
      message: message.trim(),
    });

    setFeedbacks([newItem, ...feedbacks]);
    setMessage('');
    setWorkshopTopic('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          Safe & Confidential Space
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
          Anonymous Student Feedback & Reflections
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Share your candid thoughts, workshop experiences, and reflections on self-exploration. No student ID, roll number, or personal details are ever collected or stored.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Feedback Submission Form */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <MessageSquare className="w-5 h-5 text-[#0f2942]" />
            <h2 className="text-lg font-bold text-slate-900">
              Submit Anonymous Reflection
            </h2>
          </div>

          {submitted && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Thank you! Your reflection was submitted.</span>
                Your input directly helps the UHV Cell coordinators foster a more harmonious campus.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Feedback Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnonymousFeedback['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white"
              >
                <option value="Workshop">Workshop / Induction Session</option>
                <option value="Peer Harmony">Peer Relationships & Harmony</option>
                <option value="Self Exploration">Self-Exploration (Desire vs Need)</option>
                <option value="Cell Activity">UHV Cell Initiative</option>
                <option value="General">General Reflection / Suggestion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session or Workshop Topic (Optional)
              </label>
              <input
                type="text"
                value={workshopTopic}
                onChange={(e) => setWorkshopTopic(e.target.value)}
                placeholder="e.g. Trust & Respect in Relationships"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Experience Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-hidden transition-colors"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-2">
                  {rating === 5 && 'Enlightening & Impactful'}
                  {rating === 4 && 'Very Insightful'}
                  {rating === 3 && 'Helpful'}
                  {rating === 2 && 'Needs Improvement'}
                  {rating === 1 && 'Not Helpful'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Reflection / Constructive Feedback
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you realize or feel? What suggestions do you have for UHV Cell activities?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-slate-600 text-xs">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> No IP address, browser cookie, or student identity is tracked. Submissions are strictly anonymous.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0f2942] hover:bg-[#1a3a5c] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Anonymous Reflection
            </button>
          </form>
        </div>

        {/* Community Insights & Values Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-[#0f2942] to-[#1e4975] text-white p-6 rounded-2xl shadow-md">
            <HeartHandshake className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="font-serif font-bold text-lg text-white">
              Why Feedback Matters
            </h3>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed">
              Universal Human Values education is not a set of dogmas or moral preachings; it is a process of self-exploration through natural acceptance.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-amber-200 italic font-serif">
              “Verify whatever is shared on the basis of your own Natural Acceptance.”
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-3">
              Recent Anonymous Reflections
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {feedbacks.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#0f2942] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  {item.workshopTopic && (
                    <div className="text-[11px] font-medium text-slate-500 mb-1">
                      {item.workshopTopic}
                    </div>
                  )}
                  <p className="text-xs text-slate-700 italic">
                    &ldquo;{item.message}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

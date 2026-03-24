import React, { useEffect } from 'react';
import { View, Blog } from '../types';
import { Calendar, User, ArrowLeft, Share2, Link as LinkIcon, ArrowRight } from 'lucide-react';

interface BlogDetailViewProps {
  blog: Blog;
  setView: (view: View) => void;
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({ blog, setView }) => {
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!blog) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã copy đường dẫn bài viết!');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Header Section */}
      <div className="relative h-[60vh] min-h-[400px] bg-stone-900 w-full flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={blog.image || 'https://images.unsplash.com/photo-1599643478524-fb66f7fbcbef'} 
            alt={blog.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent"></div>
        </div>

        {/* Back Button - Top Left */}
        <button
          onClick={() => setView('blog')}
          className="absolute top-8 left-8 z-30 inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium py-2 px-6 rounded-full transition-all shadow-sm border border-white/20 group"
        >
          <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Trở Về Danh Sách
        </button>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mt-20">


          <h1 className="text-4xl md:text-5xl lg:text-6xl font-be-vietnam font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center space-x-6 text-stone-200 text-sm font-medium">
            <div className="flex items-center bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              <Calendar size={16} className="mr-2 text-teal-400" />
              {new Date(blog.created_at).toLocaleDateString('vi-VN')}
            </div>
            <div className="flex items-center bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              <User size={16} className="mr-2 text-teal-400" />
              Tác giả: <span className="text-white ml-1 font-bold">{blog.author}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-8 md:p-12 lg:p-16">

          {/* Excerpt */}
          <div className="text-xl md:text-2xl font-serif text-teal-900 italic font-medium leading-relaxed mb-10 border-l-4 border-teal-500 pl-6 bg-teal-50/50 py-4 pr-4 rounded-r-lg">
            {blog.excerpt}
          </div>

          {/* HTML Content */}
          <div
            className="prose prose-lg md:prose-xl prose-stone max-w-none break-words
              prose-headings:font-be-vietnam prose-headings:text-teal-900 prose-headings:font-bold
              prose-p:text-stone-700 prose-p:leading-relaxed
              prose-a:text-teal-600 prose-a:font-medium hover:prose-a:text-teal-800 transition-colors
              prose-img:rounded-xl prose-img:shadow-md
              prose-blockquote:border-l-teal-500 prose-blockquote:bg-stone-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:font-serif prose-blockquote:italic
              prose-strong:text-stone-900
              prose-li:text-stone-700"
            dangerouslySetInnerHTML={{ __html: blog.content ? blog.content.replace(/&nbsp;/g, ' ') : '' }}
          />

          {/* Footer Metadata */}
          <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <span className="font-bold text-stone-900 uppercase tracking-widest text-xs">Chia sẻ bài viết</span>
              <button onClick={handleShare} className="p-2 bg-stone-100 hover:bg-teal-600 text-stone-600 hover:text-white rounded-full transition-all duration-300">
                <LinkIcon size={18} />
              </button>
            </div>

            <button
              onClick={() => setView('blog')}
              className="group flex items-center font-bold text-teal-700 hover:text-teal-900 transition-colors"
            >
              Xem thêm bài viết
              <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

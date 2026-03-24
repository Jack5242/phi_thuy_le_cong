import React, { useState, useEffect } from 'react';
import { View, Blog } from '../types';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BlogListViewProps {
  setView: (view: View) => void;
  setSelectedBlog: (blog: Blog) => void;
}

export const BlogListView: React.FC<BlogListViewProps> = ({ setView, setSelectedBlog }) => {
  const { t } = useLanguage();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blogs')
      .then(res => res.json())
      .then(data => {
        setBlogs(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch blogs', err);
        setIsLoading(false);
      });
  }, []);

  const handleBlogClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setView('blog-detail');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <BookOpen className="h-12 w-12 text-teal-700 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-teal-900 tracking-tight mb-4">{t('blog.list.title')}</h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto font-medium">{t('blog.list.desc')}</p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-stone-100">
            <BookOpen className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-stone-500">{t('blog.list.empty.title')}</h2>
            <p className="text-stone-400 mt-2">{t('blog.list.empty.desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => handleBlogClick(blog)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
              >
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img 
                    src={blog.image || 'https://images.unsplash.com/photo-1599643478524-fb66f7fbcbef'} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-white/90 backdrop-blur-sm text-teal-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                      {t('blog.list.badge')}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center space-x-4 text-xs font-medium text-stone-500 mb-4">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1.5 text-teal-600" />
                      {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center">
                      <User size={14} className="mr-1.5 text-teal-600" />
                      {blog.author}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-be-vietnam text-stone-900 mb-3 group-hover:text-teal-700 transition-colors leading-snug">
                    {blog.title}
                  </h3>

                  <p className="text-stone-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center text-teal-700 font-bold text-sm group-hover:text-teal-900 transition-colors mt-auto w-fit">
                    <span className="relative">
                      {t('home.blog.readMore')}
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                    </span>
                    <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

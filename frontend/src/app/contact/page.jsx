'use client';

import { useState } from 'react';

export default function ContactUs() {
    const [formData, setFormData] = useState({
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Subject validation
        if (!formData.subject) {
            newErrors.subject = 'Subject is required';
        } else if (formData.subject.length < 3) {
            newErrors.subject = 'Subject must be at least 3 characters long';
        }

        // Message validation
        if (!formData.message) {
            newErrors.message = 'Message is required';
        } else if (formData.message.length < 10) {
            newErrors.message = 'Message must be at least 10 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Here you would normally make an API call to send the message
            console.log('Form submitted:', formData);
            
            // Clear form and show success message
            setFormData({ email: '', subject: '', message: '' });
            setStatus({
                type: 'success',
                message: 'Thank you for your message. We will get back to you soon!'
            });
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Failed to send message. Please try again later.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Contact Us
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Got a technical issue? Want to send feedback about a feature? Let us know.
                    </p>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            status.type === 'success' 
                            ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                            : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label 
                                htmlFor="email" 
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Your email
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white transition-colors ${
                                    errors.email 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:focus:ring-red-500 dark:focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-primary-600 focus:border-primary-600 dark:border-gray-600 dark:focus:ring-primary-500 dark:focus:border-primary-500'
                                }`}
                                placeholder="name@company.com" 
                                disabled={loading}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label 
                                htmlFor="subject" 
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Subject
                            </label>
                            <input 
                                type="text" 
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className={`bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white transition-colors ${
                                    errors.subject 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:focus:ring-red-500 dark:focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-primary-600 focus:border-primary-600 dark:border-gray-600 dark:focus:ring-primary-500 dark:focus:border-primary-500'
                                }`}
                                placeholder="Let us know how we can help you" 
                                disabled={loading}
                            />
                            {errors.subject && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
                            )}
                        </div>

                        <div>
                            <label 
                                htmlFor="message" 
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Your message
                            </label>
                            <textarea 
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows="6" 
                                className={`bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white transition-colors ${
                                    errors.message 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:focus:ring-red-500 dark:focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-primary-600 focus:border-primary-600 dark:border-gray-600 dark:focus:ring-primary-500 dark:focus:border-primary-500'
                                }`}
                                placeholder="Leave a comment..."
                                disabled={loading}
                            />
                            {errors.message && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : 'Send message'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

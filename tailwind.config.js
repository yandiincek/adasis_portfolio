/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                alamtri: {
                    primary: '#082f49',
                    secondary: '#0369a1',
                    cyan: '#0891b2',
                    green: '#10b981',
                    orange: '#f59e0b',
                    light: '#f8fafc',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
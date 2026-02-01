import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/api/'], // Protect admin areas
        },
        sitemap: 'https://semadej.com.br/sitemap.xml',
    };
}

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { PAGES } from './seo-routes.mjs';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://slice.fusion-labs.cc';

function getLastModifiedDate(filePath) {
  try {
    // Try to get the last commit date from Git
    const gitDate = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: 'utf8' }).trim();
    if (gitDate) {
      // Return ISO Date format YYYY-MM-DD
      return gitDate.split('T')[0];
    }
  } catch (error) {
    // Console warning but continue to fallback
  }

  try {
    // Fallback to filesystem mtime
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch (error) {
    // Final fallback to today's date
    return new Date().toISOString().split('T')[0];
  }
}

function generateSitemap() {
  console.log('Generating automated sitemap.xml...');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of PAGES) {
    const fullPath = path.resolve(__dirname, '..', page.file);
    const lastmod = getLastModifiedDate(fullPath);
    
    xml += '  <url>\n';
    xml += `    <loc>${DOMAIN}${page.path}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Successfully generated sitemap.xml at ${sitemapPath}`);
}

generateSitemap();

// utils/pdfExport.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const formatTrendData = (data) => {
  const { googleTrends, news, reddit } = data;
  
  // Format Google Trends data
  const trendsText = googleTrends.timeline_data ? googleTrends.timeline_data.map(trend => 
    `• Date: ${trend.date}
  Interest Score: ${trend.values[0].extracted_value}%`
  ).join('\n\n') : 'No trend data available.';

  const interestByRegionText = googleTrends.interest_by_region ? googleTrends.interest_by_region.map(region =>
    `• ${region.region}: ${region.value}%`
  ).join('\n') : '';

  // Format News data
  const newsText = news.map(article => 
    `• ${article.title}\n  Source: ${article.source.name}\n  Published: ${new Date(article.publishedAt).toLocaleString()}`
  ).join('\n\n');

  // Format Reddit data
  const redditText = reddit.map(post => 
    `• ${post.title}\n  Subreddit: r/${post.subreddit}\n  Score: ${post.score.toLocaleString()} | Comments: ${post.num_comments.toLocaleString()}`
  ).join('\n\n');

  return { trendsText, newsText, redditText, interestByRegionText };
};

const exportTrendToPDF = (data, fileName = 'trend-summary.pdf') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filePath = path.join(__dirname, '..', 'exports', fileName);

      // Ensure exports folder exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('TrendLens Analysis Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      const { trendsText, newsText, redditText, interestByRegionText } = formatTrendData(data);

      // Google Trends Section
      doc.fontSize(18).text('🔍 Google Trends Analysis', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Current trending search terms and their relative interest scores:');
      doc.moveDown();
      doc.fontSize(12).text(trendsText || 'No trend data available.');
      doc.moveDown();
      doc.fontSize(12).text('Interest by Region:');
      doc.moveDown();
      doc.fontSize(12).text(interestByRegionText || 'No regional interest data available.');
      doc.moveDown(2);

      // News Section
      doc.fontSize(18).text('📰 News Coverage', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Recent news articles related to the topic:');
      doc.moveDown();
      doc.fontSize(12).text(newsText || 'No news articles available.');
      doc.moveDown(2);

      // Reddit Section
      doc.fontSize(18).text('💬 Reddit Discussions', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Popular discussions from Reddit:');
      doc.moveDown();
      doc.fontSize(12).text(redditText || 'No Reddit discussions available.');

      doc.end();

      stream.on('finish', () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  exportTrendToPDF,
};

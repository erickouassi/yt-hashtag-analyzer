export default async function handler(req, res) {
  const tag = req.query.tag;
  const url = `https://www.youtube.com/hashtag/${tag}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();

    // Extract "44K videos • 12K channels"
    const statsRegex = /([\d.,]+[KMB]?)\s+videos\s+•\s+([\d.,]+[KMB]?)\s+channels/i;
    const statsMatch = html.match(statsRegex);

    if (!statsMatch) {
      return res.status(404).json({ error: "Stats not found for this hashtag." });
    }

    const videoUsage = statsMatch[1];
    const channelUsage = statsMatch[2];

    const videoNum = convertToNumber(videoUsage);
    const channelNum = convertToNumber(channelUsage);

    const category = classify(videoNum, channelNum);

    // Extract related hashtags (your working version)
    const related = extractRelatedHashtags(html, tag);

    res.status(200).json({
      hashtag: `#${tag}`,
      videoUsage,
      channelUsage,
      category: category.name,
      meaning: category.meaning,
      action: category.action,
      suggestions: related.slice(0, 10) // top 10
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Convert "11K" → 11000, "1.5B" → 1500000000
function convertToNumber(str) {
  if (str.endsWith("K")) return parseFloat(str) * 1000;
  if (str.endsWith("M")) return parseFloat(str) * 1000000;
  if (str.endsWith("B")) return parseFloat(str) * 1000000000;
  return parseFloat(str);
}

// Classification logic
function classify(video, channel) {
  const categories = [
    { name: "Viral", v: 10000000, c: 500000, meaning: "Massive trend. Extremely competitive.", action: "Use 1–2 for reach." },
    { name: "Competitive", v: 5000000, c: 100000, meaning: "Big creators dominate.", action: "Use 1–2 if relevant." },
    { name: "Popular", v: 1000000, c: 50000, meaning: "High reach. Widely used.", action: "Use 2–3 for visibility." },
    { name: "Growing", v: 500000, c: 10000, meaning: "Trending upward.", action: "Use 2–3 for growth." },
    { name: "Niche", v: 100000, c: 5000, meaning: "Focused audience.", action: "Use 2–3 to target." },
    { name: "Low", v: 10000, c: 1000, meaning: "Low competition.", action: "Use 1–2 to rank." },
    { name: "Rare", v: 1000, c: 100, meaning: "Very lightly used.", action: "Use 1 for experiments." },
    { name: "Untapped", v: 0, c: 0, meaning: "No usage.", action: "Use only if perfect match." }
  ];

  for (const cat of categories) {
    if (video >= cat.v && channel >= cat.c) return cat;
  }

  return categories[categories.length - 1];
}

// Extract related hashtags (your original working version)
function extractRelatedHashtags(html, mainTag) {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = html.match(hashtagRegex) || [];

  const counts = {};

  matches.forEach(tag => {
    const clean = tag.replace("#", "").toLowerCase();

    // avoid junk UI tags
    if (clean === mainTag.toLowerCase()) return;
    if (["yt", "youtube", "shorts"].includes(clean)) return;

    counts[clean] = (counts[clean] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]) // sort by frequency
    .map(entry => entry[0]); // return only the hashtag names
}


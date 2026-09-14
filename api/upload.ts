export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({
      error: 'IMAGEKIT_PRIVATE_KEY is not configured on the server.',
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
    
    // Forward the multipart request or fetch upload directly
    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
      },
      body: req,
    });

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({
        error: data?.message || 'Tải ảnh lên ImageKit không thành công.',
      });
    }

    // Return strictly sanitized public projection
    return res.status(200).json({
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || data.url,
      fileId: data.fileId,
      name: data.name,
      filePath: data.filePath,
      size: data.size,
    });
  } catch (error: any) {
    console.error('Vercel ImageKit upload handler error:', error);
    return res.status(500).json({ error: 'Có lỗi xảy ra trong quá trình xử lý tải ảnh.' });
  }
}

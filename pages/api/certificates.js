import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('certificate_gallery');
  const collection = db.collection('certificates');

  if (req.method === 'GET') {
    const { title, category, startDate, endDate } = req.query;
    const query = {};
    if (title) query.title = { $regex: title, $options: 'i' };
    if (category && category !== 'all') query.category = category;
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { $lte: new Date(endDate) };

    try {
      const certificates = await collection.find(query).sort({ date: -1 }).toArray();
      res.json(certificates.map(c => ({ ...c, _id: c._id.toString() })));
    } catch {
      res.status(500).json({ message: 'Failed to fetch certificates' });
    }
  } else if (req.method === 'POST') {
    const { title, issuer, date, category, fileBase64, isPdf } = req.body;
    if (!title || !issuer || !date || !category || !fileBase64) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
      const result = await collection.insertOne({
        title,
        issuer,
        date,
        category,
        fileBase64,
        isPdf
      });
      res.status(201).json({ message: 'Certificate added', id: result.insertedId.toString() });
    } catch {
      res.status(500).json({ message: 'Failed to add certificate' });
    }
  } else if (req.method === 'PUT') {
    const { id, title, issuer, date, category, fileBase64, isPdf } = req.body;
    if (!id || !title || !issuer || !date || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
      const updateFields = { title, issuer, date, category };
      if (fileBase64) {
        updateFields.fileBase64 = fileBase64;
        updateFields.isPdf = isPdf;
      }
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
      res.status(200).json({ message: 'Certificate updated' });
    } catch {
      res.status(500).json({ message: 'Failed to update certificate' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { ids } = req.body;
  
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid or missing "ids" in request body' });
      }
  
      const objectIds = ids.map(id => new ObjectId(id));
      await collection.deleteMany({ _id: { $in: objectIds } });
  
      res.status(200).json({ message: 'Certificates deleted successfully' });
    } catch (err) {
      console.error('Bulk delete error:', err);
      res.status(500).json({ message: 'Failed to delete certificates' });
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase if your base64 data is larger
    }
  }
};

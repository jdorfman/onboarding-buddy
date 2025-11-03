import { Router } from 'express';
import { DatabaseService } from '../db/database.js';
import { AmpService } from '../services/ampService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const db = new DatabaseService();
const ampService = new AmpService();

router.get('/', async (req, res) => {
  try {
    const guides = db.getAllGuides();
    res.json(guides.map(guide => ({
      ...guide,
      prerequisites: JSON.parse(guide.prerequisites || '[]')
    })));
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const guide = db.getGuideById(id);

    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    res.json(guide);
  } catch (error) {
    console.error('Error fetching guide:', error);
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const codebaseContext = await ampService.searchCodebase(topic);
    const guide = await ampService.generateSetupGuide(topic, codebaseContext);

    const guideId = db.insertGuide(
      guide.title,
      guide.description,
      guide.content,
      guide.prerequisites,
      guide.difficulty,
      guide.estimatedTime
    );

    res.json({ id: guideId, ...guide });
  } catch (error) {
    console.error('Error generating guide:', error);
    res.status(500).json({ error: 'Failed to generate guide' });
  }
});

export default router;

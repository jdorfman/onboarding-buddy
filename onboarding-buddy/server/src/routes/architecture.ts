import { Router } from 'express';
import { DatabaseService } from '../db/database';
import { AmpService } from '../services/ampService';

const router = Router();
const db = new DatabaseService();
const ampService = new AmpService();

router.get('/', async (req, res) => {
  try {
    const docs = db.getAllArchitectureDocs();
    res.json(docs.map(doc => ({
      ...doc,
      dependencies: JSON.parse(doc.dependencies || '[]'),
      techStack: JSON.parse(doc.tech_stack || '[]'),
      filePaths: JSON.parse(doc.file_paths || '[]'),
      codeExamples: JSON.parse(doc.code_examples || '[]')
    })));
  } catch (error) {
    console.error('Error fetching architecture docs:', error);
    res.status(500).json({ error: 'Failed to fetch architecture docs' });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const doc = db.getArchitectureByComponent(name);

    if (!doc) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(doc);
  } catch (error) {
    console.error('Error fetching architecture doc:', error);
    res.status(500).json({ error: 'Failed to fetch architecture doc' });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const { component } = req.body;

    if (!component) {
      return res.status(400).json({ error: 'Component name is required' });
    }

    const existingDoc = db.getArchitectureByComponent(component);
    if (existingDoc) {
      return res.json(existingDoc);
    }

    const explanation = await ampService.explainArchitecture(component);

    const docId = db.insertArchitectureDoc(
      explanation.componentName,
      explanation.description,
      explanation.dependencies,
      explanation.techStack,
      explanation.filePaths,
      explanation.codeExamples
    );

    res.json({ id: docId, ...explanation });
  } catch (error) {
    console.error('Error explaining architecture:', error);
    res.status(500).json({ error: 'Failed to explain architecture' });
  }
});

export default router;

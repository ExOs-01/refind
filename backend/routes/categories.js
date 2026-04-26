const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/categories — get all categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('category')
      .select('category_id, category_name')
      .order('category_id');

    if (error) return res.status(500).json({ error: 'Could not fetch categories.' });

    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/categories — add category (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) return res.status(400).json({ error: 'Category name is required.' });

    const { data, error } = await supabaseAdmin
      .from('category')
      .insert({ category_name })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Could not add category.' });

    res.status(201).json({ message: 'Category added.', category: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/categories/:id — delete category (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('category')
      .delete()
      .eq('category_id', req.params.id);

    if (error) return res.status(500).json({ error: 'Could not delete category.' });

    res.json({ message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

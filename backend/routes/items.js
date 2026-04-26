const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Multer — store upload in memory then send to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

// GET /api/items — get all items with category info
// Query params: status, category_id, search
router.get('/', async (req, res) => {
  try {
    const { status, category_id, search } = req.query;

    let query = supabaseAdmin
      .from('item')
      .select(`
        item_id, title, description, status, location_found,
        date_reported, photo_url, created_at,
        category:category_id ( category_id, category_name ),
        poster:posted_by ( user_id, full_name )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location_found.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get items error:', error);
      return res.status(500).json({ error: 'Could not fetch items.' });
    }

    res.json({ items: data });

  } catch (err) {
    console.error('Get items exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/items/:id — get single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('item')
      .select(`
        item_id, title, description, status, location_found,
        date_reported, photo_url, created_at,
        category:category_id ( category_id, category_name ),
        poster:posted_by ( user_id, full_name, email )
      `)
      .eq('item_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json({ item: data });

  } catch (err) {
    console.error('Get item exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/items — create new item (auth required)
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, status, location_found, date_reported, category_id } = req.body;

    if (!title || !status || !location_found || !date_reported || !category_id) {
      return res.status(400).json({ error: 'Title, status, location, date, and category are required.' });
    }

    let photo_url = null;

    // Upload photo to Supabase Storage if provided
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('item-photos')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Don't fail the whole request if photo fails
      } else {
        const { data: urlData } = supabaseAdmin.storage
          .from('item-photos')
          .getPublicUrl(fileName);
        photo_url = urlData.publicUrl;
      }
    }

    // Insert item
    const { data: newItem, error: itemError } = await supabaseAdmin
      .from('item')
      .insert({
        title,
        description,
        status,
        location_found,
        date_reported,
        photo_url,
        category_id: parseInt(category_id),
        posted_by: req.user.user_id
      })
      .select('item_id')
      .single();

    if (itemError) {
      console.error('Insert item error:', itemError);
      return res.status(500).json({ error: 'Could not save item.' });
    }

    // Insert post record
    await supabaseAdmin.from('post').insert({
      user_id: req.user.user_id,
      item_id: newItem.item_id
    });

    res.status(201).json({
      message: 'Item posted successfully.',
      item_id: newItem.item_id
    });

  } catch (err) {
    console.error('Post item exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/items/:id/status — update item status (auth required, own items or admin)
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['lost', 'found', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be lost, found, or resolved.' });
    }

    // Check item exists and user owns it (or is admin)
    const { data: item } = await supabaseAdmin
      .from('item')
      .select('item_id, posted_by')
      .eq('item_id', id)
      .single();

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.posted_by !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own items.' });
    }

    const { error } = await supabaseAdmin
      .from('item')
      .update({ status })
      .eq('item_id', id);

    if (error) {
      return res.status(500).json({ error: 'Could not update status.' });
    }

    res.json({ message: 'Status updated successfully.' });

  } catch (err) {
    console.error('Update status exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/items/:id — delete item (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('item')
      .delete()
      .eq('item_id', id);

    if (error) {
      return res.status(500).json({ error: 'Could not delete item.' });
    }

    res.json({ message: 'Item deleted successfully.' });

  } catch (err) {
    console.error('Delete item exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/items/user/my-posts — get current user's own posts
router.get('/user/my-posts', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('item')
      .select(`
        item_id, title, description, status, location_found,
        date_reported, photo_url, created_at,
        category:category_id ( category_name )
      `)
      .eq('posted_by', req.user.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Could not fetch your posts.' });
    }

    res.json({ items: data });

  } catch (err) {
    console.error('My posts exception:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

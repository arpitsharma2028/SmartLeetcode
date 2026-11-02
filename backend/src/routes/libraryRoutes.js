const router = require('express').Router();
const requireUser = require('../middleware/requireUser');
const library = require('../controllers/libraryController');

router.use(requireUser);
router.get('/metadata', library.metadata);
router.get('/questions', library.questions);
router.get('/summary', library.summary);
router.get('/folders', library.folders);
router.post('/folders', library.createFolder);
router.delete('/folders/:id', library.deleteFolder);
router.get('/items', library.items);
router.post('/items', library.saveItem);
router.patch('/items/:id', library.updateItem);
router.post('/items/:id/review', library.completeReview);
router.delete('/items/:id', library.deleteItem);

module.exports = router;

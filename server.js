require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const app = express();

const GIT_TOKEN = process.env.GIT_TOKEN; // GitHub Personal Access Token
const GIT_REPO = process.env.GIT_REPO;   // Наприклад: height2101stu/kalnibolota
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Функція для оновлення файлу на GitHub
async function updateFileOnGitHub(filename, content) {
  try {
    const apiUrl = `https://api.github.com/repos/${GIT_REPO}/contents/public/${filename}`;

    // Отримуємо SHA файлу (якщо існує)
    const getResp = await fetch(apiUrl, {
      headers: { Authorization: `token ${GIT_TOKEN}`, Accept: 'application/vnd.github+json' }
    });

    const getData = await getResp.json();
    const sha = getData.sha; // якщо файл існує, беремо SHA для оновлення

    // Формуємо тіло запиту для commit
    const body = {
      message: "Автоматичне оновлення полігонів",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: GIT_BRANCH,
      sha: sha ? sha : undefined
    };

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { Authorization: `token ${GIT_TOKEN}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify(body)
    });

    const putData = await putResp.json();
    console.log('GitHub update response:', putData);
    return putData;
  } catch (err) {
    console.error('Помилка при оновленні GitHub:', err);
    throw err;
  }
}

// POST для полігонів
app.post('/polygons', async (req, res) => {
  const polygons = req.body;
  try {
    await updateFileOnGitHub('polygons.json', polygons);
    res.send('Полігони збережено у GitHub ✅');
  } catch (err) {
    res.status(500).send('Помилка збереження на GitHub');
  }
});

// GET головної сторінки
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

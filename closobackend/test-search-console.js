const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  },
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

searchconsole.sites.list()
  .then(res => {
    console.log('✅ API Bağlantısı Başarılı!');
    console.log('Sites:', JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('❌ Hata:', err.message);
  });

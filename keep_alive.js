const express = require('express');
const app = express();

app.all('*', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is ready on port ${port}. Keep-alive active.`);
    });
}

module.exports = keepAlive;

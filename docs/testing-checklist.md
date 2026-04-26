# Testing Checklist

- Inspect the popup console and review the `[Frontend Audit]` logs
- Inspect the webpage console and confirm `[Frontend Audit] content script loaded`
- Trigger an audit and confirm `[Frontend Audit] audit request received` appears in the page console
- Run `npm run build` and verify `dist/content.js` exists
- Open `dist/manifest.json` and confirm it references `content.js`
- Verify `dist/background.js` exists and `background.service_worker` points to it
- Open a normal `http://` or `https://` page and confirm the popup can analyze it
- If messaging fails, verify the popup logs show the sendMessage failure and injection retry path

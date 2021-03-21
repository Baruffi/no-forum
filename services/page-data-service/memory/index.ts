import Page from 'interfaces/Page';
import PageDataService from 'interfaces/PageDataService';

const memoryPages = new Map<string, Page>();

async function get(pageId: string) {
  return (
    memoryPages.get(pageId) || {
      id: pageId,
      html: `
      <input id="input_teste">
      <button onClick=alert(document.getElementById('input_teste').value)>Alertar</button>
      <br>
      <a href="/test">Test link</a>
      `,
    }
  );
}

async function put(pageId: string, html: string) {
  memoryPages.set(pageId, { id: pageId, html });
}

async function del(pageId: string, html: string) {
  memoryPages.set(pageId, {
    id: pageId,
    html: memoryPages.get(pageId).html.replace(html, ''),
  });
}

const MemoryPageDataService: PageDataService = {
  get,
  put,
  del,
};

export default MemoryPageDataService;

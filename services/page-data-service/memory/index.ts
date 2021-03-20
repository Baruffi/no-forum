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

  console.log(memoryPages);
}

const MemoryPageDataService: PageDataService = {
  get,
  put,
};

export default MemoryPageDataService;

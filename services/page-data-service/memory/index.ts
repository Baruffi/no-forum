import Page from 'interfaces/Page';
import PageDataService from 'interfaces/PageDataService';

const memoryPages = new Map<string, Page>();

async function get(pageId: string) {
  return memoryPages.get(pageId) || { id: pageId, html: '' };
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

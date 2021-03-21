import Page from 'interfaces/Page';
import PageDataService from 'interfaces/PageDataService';
import Lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

interface Schema {
  pages: Page[];
}

const db = Lowdb(new FileAsync<Schema>('resources/db.json'));

async function init() {
  (await db).defaults({ pages: [] }).write();
}

async function get(pageId: string) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  return (await db).get('pages').find({ id: pageId }).value();
}

async function put(pageId: string, html: string) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  const pageStore = (await db).get('pages');

  const page = pageStore.find({ id: pageId }).value();

  if (page) {
    pageStore
      .find({ id: pageId })
      .assign({ id: pageId, html: page.html + html })
      .write();
  } else {
    pageStore.push({ id: pageId, html }).write();
  }
}

async function del(pageId: string, html: string) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  const pageStore = (await db).get('pages');

  const page = pageStore.find({ id: pageId }).value();

  if (page) {
    pageStore
      .find({ id: pageId })
      .assign({ id: pageId, html: page.html.replace(html, '') })
      .write();
  }
}

const LowdbPageDataService: PageDataService = {
  get,
  put,
  del,
};

export default LowdbPageDataService;

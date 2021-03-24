import { Page, PageDataService, PageFragment } from 'interfaces/Pages';
import Lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import { nanoid } from 'nanoid';

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

async function put(pageId: string, html: string, invisible: boolean) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  const pageStore = (await db).get('pages');
  const page = pageStore.find({ id: pageId }).value();

  const id = nanoid();

  if (page) {
    pageStore
      .find({ id: pageId })
      .assign({
        id: pageId,
        fragments: [...page.fragments, { id, html, invisible }],
      })
      .write();
  } else {
    pageStore
      .push({ id: pageId, fragments: [{ id, html, invisible }] })
      .write();
  }
}

async function rep(
  pageId: string,
  fragmentId: string,
  html: string,
  invisible: boolean
) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  const pageStore = (await db).get('pages');

  const page = pageStore.find({ id: pageId }).value();

  if (page) {
    const htmlFragment = page.fragments.find(
      (fragment) => fragment.id === fragmentId
    );
    const idx = page.fragments.indexOf(htmlFragment);
    const htmlFragments = [...page.fragments];
    htmlFragments[idx] = { id: htmlFragment.id, html, invisible };

    pageStore
      .find({ id: pageId })
      .assign({
        id: pageId,
        fragments: htmlFragments,
      })
      .write();
  }
}

async function del(pageId: string, fragmentId: string) {
  const hasPageStore = (await db).has('pages').value();

  if (!hasPageStore) {
    await init();
  }

  const pageStore = (await db).get('pages');

  const page = pageStore.find({ id: pageId }).value();

  if (page) {
    pageStore
      .find({ id: pageId })
      .assign({
        id: pageId,
        fragments: page.fragments.filter(
          (fragment) => fragment.id !== fragmentId
        ),
      })
      .write();
  }
}

const LowdbPageDataService: PageDataService = {
  get,
  put,
  rep,
  del,
};

export default LowdbPageDataService;

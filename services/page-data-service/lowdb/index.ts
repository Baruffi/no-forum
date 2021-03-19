import Page from 'interfaces/Page';
import PageDataService from 'interfaces/PageDataService';
import Lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

interface Schema {
  pages: Page[];
}

const db = Lowdb(new FileAsync<Schema>('resources/db.json'));

async function get(pageId: string) {
  return (await db).get('pages').find({ id: pageId }).value();
}

async function put(pageId: string, html: string) {
  const pageStore = (await db).get('pages');

  if (pageStore.find({ id: pageId }).value()) {
    pageStore.find({ id: pageId }).assign({ id: pageId, html }).write();
  } else {
    pageStore.push({ id: pageId, html }).write();
  }
}

const LowdbPageDataService: PageDataService = {
  get,
  put,
};

export default LowdbPageDataService;

// class LowdbPageDataService implements PageDataService {
//   private db: Lowdb.LowdbAsync<Schema>;

//   async initDb() {
//     this.db = await Lowdb(new FileAsync<Schema>('resources/db.json'));
//   }

//   async get(pageId: string) {
//     if (!this.db) {
//       await this.initDb();
//     }

//     return this.db.get('pages').find({ id: pageId }).value();
//   }

//   async put(pageId: string, html: string) {
//     if (!this.db) {
//       await this.initDb();
//     }

//     const pageStore = this.db.get('pages');

//     if (pageStore.find({ id: pageId }).value()) {
//       pageStore.find({ id: pageId }).assign({ id: pageId, html }).write();
//     } else {
//       pageStore.push({ id: pageId, html }).write();
//     }
//   }
// }

// export default new LowdbPageDataService();

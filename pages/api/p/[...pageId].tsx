import { Parser } from 'htmlparser2';
import { Replacement } from 'interfaces/Pages';
import DOMPurify from 'isomorphic-dompurify';
import { NextApiRequest, NextApiResponse } from 'next';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';

interface ChunkList {
  [s: string]: string;
}

function customSanitize(html: string) {
  const cssBadUrl = /[\w-]+\s*:\s*url\(\s*(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?\s*\)((.|\s)*?;)?/g;
  const cssBadZIndex = /z-index\s*:\s*(-)?\d\d\d\d+\s*;?/g;
  const htmlEmptyStyleTag = /<style(\s*|([\w-]+="(.|\s)*?"))*?>\s*?<\/\s*style\s*>\s*/g;
  const htmlEmptyStyleAttribute = /\s*style\s*=\s*"\s*"/g;
  const htmlOpenTagStr = '<TAGHERE(\\s*|([\\w-]+="(.|\\s)*?"))*?>\\s*';
  const htmlCloseTagStr = '</\\s*TAGHERE\\s*>\\s*';
  const cssChunks: ChunkList = {};
  const noTextChunks: ChunkList = {};

  let openedWithNoText = [];
  let openCss = 0;

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'style') {
        openCss++;
      }

      if (attribs.style) {
        cssChunks[attribs.style] = attribs.style
          .replace(cssBadUrl, '')
          .replace(cssBadZIndex, '');
      }

      openedWithNoText.push(name);
    },
    ontext(text) {
      if (openCss) {
        cssChunks[text] = text.replace(cssBadUrl, '').replace(cssBadZIndex, '');
      }

      if (text.trim()) {
        openedWithNoText = [];
      }
    },
    onclosetag(name) {
      if (openedWithNoText.length > 0 && openedWithNoText[0] === name) {
        if (
          !(
            openedWithNoText.includes('input') ||
            openedWithNoText.includes('select') ||
            openedWithNoText.includes('textarea') ||
            openedWithNoText.includes('button') ||
            openedWithNoText.includes('fieldset') ||
            openedWithNoText.includes('datalist') ||
            openedWithNoText.includes('output') ||
            openedWithNoText.includes('optgroup')
          )
        ) {
          const emptyTags =
            openedWithNoText
              .map(
                (emptyTag) => `${htmlOpenTagStr.replace('TAGHERE', emptyTag)}`
              )
              .join('') +
            openedWithNoText
              .reverse()
              .map(
                (emptyTag) => `${htmlCloseTagStr.replace('TAGHERE', emptyTag)}`
              )
              .join('');

          noTextChunks[emptyTags] = '';
        }

        openedWithNoText = [];
      }

      if (name === 'style' && openCss) {
        openCss--;
      }
    },
  });

  parser.write(html);
  parser.end();

  let cleanHtml = html;
  let invisible = false;

  console.log('CSS');

  for (const chunk in cssChunks) {
    if (Object.prototype.hasOwnProperty.call(cssChunks, chunk)) {
      const cssChunk = cssChunks[chunk];
      console.log(chunk);
      console.log(cssChunk);
      cleanHtml = cleanHtml.replace(chunk, cssChunk).trim();
    }
  }

  console.log('NO TEXT');

  for (const chunk in noTextChunks) {
    if (Object.prototype.hasOwnProperty.call(noTextChunks, chunk)) {
      const noTextChunk = noTextChunks[chunk];
      console.log(chunk);
      console.log(noTextChunk);
      cleanHtml = cleanHtml.replace(RegExp(chunk, 'g'), noTextChunk).trim();
    }
  }

  console.log('CLEAN');

  cleanHtml = cleanHtml
    .replace(htmlEmptyStyleTag, '')
    .replace(htmlEmptyStyleAttribute, '');

  console.log(cleanHtml);

  if (cleanHtml) {
    const remainingTags = cleanHtml.match(
      RegExp(htmlOpenTagStr.replace('TAGHERE', '[\\w-]+'), 'g')
    );
    const remainingStyleTags = cleanHtml.match(
      RegExp(htmlOpenTagStr.replace('TAGHERE', 'style'), 'g')
    );

    if (
      remainingTags &&
      remainingStyleTags &&
      remainingTags.join('') === remainingStyleTags.join('')
    ) {
      console.log('ONLY STYLE');
      invisible = true;
    }
  }

  return { cleanHtml, invisible };
}

function filterHtml(html: string) {
  console.log('RAW');
  console.log(html);

  if (html.includes('{') && !html.includes('<')) {
    html = `<style>${html}</style>`;
  }

  // Add body tags to not lose styles in the beginning to DOMPurify
  const purifiedHtml = DOMPurify.sanitize(`<body>${html}</body>`, {
    ALLOWED_URI_REGEXP: /^(\/?[^:#/\\])*$/,
  });

  console.log('PURE');
  console.log(purifiedHtml);

  return customSanitize(purifiedHtml);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const pageId = (req.query.pageId as string[]).join('/');

  if (req.method === 'POST') {
    const body = req.body as string;

    if (body.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const { cleanHtml, invisible } = filterHtml(body);

    if (cleanHtml) {
      await PageDataService.put(pageId, cleanHtml, invisible);
    }
  } else if (req.method === 'PUT') {
    const { fragmentId, html } = req.body as Replacement;

    if (html.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const { cleanHtml, invisible } = filterHtml(html);

    if (cleanHtml) {
      await PageDataService.rep(pageId, fragmentId, cleanHtml, invisible);
    }
  } else if (req.method === 'DELETE') {
    await PageDataService.del(pageId, req.body);
  }

  const page = await PageDataService.get(pageId);

  if (page) {
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json(page);
  } else {
    res.status(204).send('');
  }
};

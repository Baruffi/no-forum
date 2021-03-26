import htmlMinifier from 'html-minifier';
import { Parser } from 'htmlparser2';
import { ChunkList } from 'interfaces/filterHtml';
import DOMPurify from 'isomorphic-dompurify';

function filterCssFragment(style: string) {
  const cssBadImportant = /[\w-]+\s*:.*?!important.*?;?/gs;
  const cssBadUrl = /[\w-]+\s*:\s*url\(\s*(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?\s*\)((.|\s)*?;)?/g;
  const cssBadZIndex = /z-index\s*:\s*(-)?\d\d\d\d+\s*;?/g;

  if (style) {
    const badImportants = style.match(cssBadImportant);

    if (badImportants) {
      for (const badImportant of badImportants) {
        const noImportant = badImportant.replace('!important', '');

        style = style.replace(badImportant, noImportant);
      }
    }

    return style.replace(cssBadUrl, '').replace(cssBadZIndex, '');
  }
}

function filterCss(html: string) {
  const cssChunks: ChunkList = {};

  let openCss = 0;

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'style') {
        openCss++;
      }

      let style = attribs.style;

      if (style) {
        cssChunks[style] = filterCssFragment(style);
      }
    },
    ontext(text) {
      if (openCss) {
        cssChunks[text] = filterCssFragment(text);
      }
    },
    onclosetag(name) {
      if (name === 'style' && openCss) {
        openCss--;
      }
    },
  });

  parser.write(html);
  parser.end();

  let filteredHtml = html;

  for (const chunk in cssChunks) {
    if (Object.prototype.hasOwnProperty.call(cssChunks, chunk)) {
      const cssChunk = cssChunks[chunk];
      filteredHtml = filteredHtml.replace(chunk, cssChunk).trim();
    }
  }

  return filteredHtml;
}

function isolateCssAndHtml(html: string) {
  const htmlStyleTag = /<style(\s*|([\w-]+=".*?"))*?>.*?<\/\s*style\s*>\s*/gs;
  const htmlOpenTagStr = '<TAGHERE(\\s*|([\\w-]+="(.|\\s)*?"))*?>\\s*';
  const htmlCloseTagStr = '</\\s*TAGHERE\\s*>\\s*';

  let isolatedHtml = html;
  let isolatedCss = '';

  if (isolatedHtml) {
    const matchedCss = isolatedHtml.match(htmlStyleTag);

    if (matchedCss) {
      for (const match of matchedCss) {
        if (match.includes('<')) {
          isolatedHtml = isolatedHtml.replace(match, '');
          isolatedCss += match
            .replace(
              RegExp(htmlOpenTagStr.replace('TAGHERE', 'style'), 'g'),
              ''
            )
            .replace(
              RegExp(htmlCloseTagStr.replace('TAGHERE', 'style'), 'g'),
              ''
            );

          if (isolatedCss.trim() && !isolatedCss.trim().endsWith('}')) {
            isolatedCss += '}';
          }
        }
      }
    }
  }

  if (isolatedCss) {
    isolatedCss = `<style>${isolatedCss}</style>`;
  }

  return { isolatedHtml, isolatedCss };
}

export default function filterHtml(html: string) {
  console.log('RAW');
  console.log(html);

  if (html.includes('{') && !html.includes('<')) {
    html = `<style>${html}`;
  }

  // Add body tags to not lose styles in the beginning to DOMPurify
  const purifiedHtml = DOMPurify.sanitize(`<body>${html}`, {
    ALLOWED_URI_REGEXP: /^((?!\/\/)\/?[^:])*$/,
  });

  console.log('PURE HTML');
  console.log(purifiedHtml);

  const filteredHtml = filterCss(purifiedHtml);

  console.log('FILTERED HTML');
  console.log(filteredHtml);

  const { isolatedHtml, isolatedCss } = isolateCssAndHtml(filteredHtml);

  console.log('ISOLATED HTML');
  console.log(isolatedHtml);

  console.log('ISOLATED CSS');
  console.log(isolatedCss);

  const minifiedHtml = htmlMinifier.minify(isolatedHtml, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeEmptyElements: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeAttributeQuotes: true,
  });

  const minifiedCss = htmlMinifier.minify(isolatedCss, {
    minifyCSS: true,
  });

  console.log('MINI HTML');
  console.log(minifiedHtml);

  console.log('MINI CSS');
  console.log(minifiedCss);

  const cleanHtml = minifiedHtml;
  const cleanCss = minifiedCss;

  return { cleanHtml, cleanCss };
}

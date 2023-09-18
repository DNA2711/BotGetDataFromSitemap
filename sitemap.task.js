const BLOCK_RESOURCES = [
  "image",
  "media",
  "stylesheet",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  // "imageset",
],
  SKIPPED_RESOURCES = [
    "quantserve",
    "adzerk",
    "doubleclick",
    "adition",
    "exelator",
    "sharethrough",
    "cdn.api.twitter",
    "google-analytics",
    "googletagmanager",
    "google",
    "fontawesome",
    "facebook",
    "analytics",
    "optimizely",
    "clicktale",
    "mixpanel",
    "zedo",
    "clicksor",
    "tiqcdn",
    "adsense",
    "analytics",
  ];
const _ = require("lodash");
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 250;
      var timer = setInterval(() => {
        //var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= 1100) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
const taskSitemap = async ({ page, data }) => {
  let { sitemap } = data;
  const { url, only_res } = data;
  //setCookies
  if (sitemap && typeof sitemap.cookies !== "undefined") {
    await page.setCookie(...sitemap.cookies);
    console.log("Page append Cookies");
  }
  //BlockResources
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const requestUrl = request._url.split("?")[0].split("#")[0];
    if (
      BLOCK_RESOURCES.indexOf(request.resourceType()) !== -1 ||
      SKIPPED_RESOURCES.some((resource) => requestUrl.indexOf(resource) !== -1)
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
  //console.log(await groupByKey(sitemap.selectors, { type: "SelectorGroup" }));
  //networkidle0;networkidle2;domcontentloaded
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  try {
    await page.evaluate(() => {
      let frames = window.frames;
      let i;

      for (i = 0; i < frames.length; i++) {
        frames[i].location = "";
      }
    });
  } catch (e) { }

  //Find captchas
  const { hostname } = new URL(url);
  //const { captchas } = await page.findRecaptchas();
  //console.log(`Found ${captchas.length} captcha on ${hostname}`);

  //Wait for selector
  if (sitemap) {
    if (typeof sitemap.waitSelector !== "undefined") {
      await page.waitForSelector(sitemap.waitSelector, {
        timeout: 2000,
      });
      console.log("Wait selector:" + sitemap.waitSelector);
    }

    //Check Sitemap Selectors Wait
    const waitSelectorSitemap = _.find(sitemap.selectors, {
      id: "waitSelector",
    });
    if (waitSelectorSitemap) {
      await page.waitForSelector(waitSelectorSitemap.selector, {
        timeout: 2000,
      });
      console.log(
        "Wait selector in sitemap config:" + waitSelectorSitemap.selector,
      );
    }

    if (typeof sitemap.click_els !== "undefined") {
      if (Array.isArray(sitemap.click_els) === true) {
        for await (let click_el of sitemap.click_els) {
          //let t_click = performance.now();
          try {
            await page.click(click_el[0], { timeout: 3000 });
            if (click_el[1] !== false) {
              await page
                .waitForSelector(click_el[1], {
                  timeout: 4000,
                })
                .then(async () => { });
            }
            console.log(
              "Click Success:" + click_el[0] + " - and wait:" + click_el[1],
            );
            //_duringExcuse("Clicked: " + click_el[0], t_click);
          } catch (e) {
            console.log("Click ERROR:" + click_el + " - Message:" + e.message);
          }
        }
      } else {
        await Promise.all([
          page.click(sitemap.click_els, { timeout: 3000 }),
          page.waitForNavigation({ waitUntil: "networkidle0" }),
        ]);
        console.log("Clicked: " + sitemap.click_els);
        //await doSleep(300);
      }
    }
  }

  //mainTasks
  // if (sitemap._id === "duckduckgo") {
  //   sitemap = duckduckgo_sitemap;
  //   return await normalSitemap(page, { sitemap: sitemap });
  // } else if (sitemap._id === "bing") {
  // } else if (sitemap._id === "google") {
  // } else {
  //   return await normalSitemap(page, { sitemap: sitemap });
  // }
  //Show console.log in page
  page.on("console", async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log("browser_msg;");
      console.log(await msgArgs[i].jsonValue());
      console.log("#end_msg;");
    }
  });
  await autoScroll(page);
  // Return
  if (only_res) {
    //await doSleep(500);
    const content_page = await page.content();
    console.log("Response:", {
      code: 1,
      data: typeof content_page !== undefined ? true : false,
    });
    if (process.env.APP_DEBUG === true) {
      await write_file("test_content", content_page);
    }
    await page.close();
    return {
      code: 1,
      data: content_page,
    };
  } else {
    //Add Script to page
    // await page.addScriptTag({
    //   url: "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js",
    // });
    return new Promise(async (resolve, reject) => {
      //Page Extract Data
      const results = await page.evaluate(
        async (sitemap, hostname) => {
          let selectors = [],
            notExistRequire = 0,
            max_required = 0;
          const regex_required = new RegExp("_require$");
          if (
            typeof sitemap !== "undefined" &&
            typeof sitemap.selectors !== undefined
          ) {
            selectors = sitemap.selectors;
          }

          Array.from(selectors).forEach((selector) => {
            if (
              typeof selector.id === "string" &&
              regex_required.test(selector.id) === true
            ) {
              max_required++;
            }
          });
          const MAX_MISSING = Math.floor(max_required * 0.7);

          const sleep = (ms) => {
            return new Promise((resolve) => setTimeout(resolve, ms));
          };
          const doSleep = async (ms) => {
            return await sleep(ms);
          };
          document
            .querySelectorAll("style")
            .forEach((el) => el.parentNode.removeChild(el));
          document
            .querySelectorAll("[style]")
            .forEach((el) => el.removeAttribute("style"));
          //Remove style tags
          try {
            window.scrollTo(0, document.body.scrollHeight);
            await doSleep(200);
          } catch (e) {
            console.log(err.message);
          }

          const data_sitemap = Array.from(selectors).map((config_item) => {
            try {
              if (config_item.id === "scroll_down") {
                window.scrollTo(0, document.body.scrollHeight);
                return {
                  id: config_item.id,
                  value: true,
                  selector: config_item.selector,
                  //parentNode: config_item.parentSelectors[0],
                };
              }
              if (regex_required.test(config_item.id) === true) {
                //todo
                try {
                  if (
                    document.querySelectorAll(config_item.selector).length > 0
                  ) {
                    console.log(`Exits: ${config_item.id}`);
                  } else {
                    //IsContinue = false;
                    notExistRequire++;
                    console.log(
                      `Require missing: ${notExistRequire}/${MAX_MISSING}`,
                    );
                  }
                } catch (err) {
                  // return {
                  //   id: config_item.id,
                  //   value: false,
                  //   selector: config_item.selector,
                  //   //parentNode: config_item.parentSelectors[0],
                  // };
                }
              }
              //Main Task Sitemap
              switch (config_item.type) {
                case "SelectorText":
                  if (config_item.multiple) {
                    const values = [];
                    document
                      .querySelectorAll(config_item.selector)
                      .forEach((el) => {
                        if (el !== null && typeof el !== undefined) {
                          if (config_item.regex !== "") {
                            const regex_str = new RegExp(
                              config_item.regex,
                              "i",
                            );
                            const matches = regex_str.exec(
                              el.textContent.trim(),
                            );
                            values.push(matches);
                          } else {
                            values.push(el.textContent.trim());
                          }
                        }
                      });

                    return {
                      id: config_item.id,
                      value: values,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  } else {
                    let value = document.querySelector(
                      config_item.selector,
                    ).textContent;
                    // if (config_item.regex !== "") {
                    //   const regex_str = new RegExp(config_item.regex);
                    //   value = regex_str.exec(value);
                    // }
                    return {
                      id: config_item.id,
                      value: value,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  }
                  break;
                case "SelectorLink":
                  if (config_item.multiple) {
                    const array_item = [];
                    document
                      .querySelectorAll(config_item.selector)
                      .forEach((item) => {
                        if (
                          typeof item !== undefined &&
                          item !== null &&
                          item.href.indexOf(hostname) > -1
                        ) {
                          array_item.push(item !== null ? item.href : "null");
                        }
                      });
                    return {
                      id: config_item.id,
                      value: array_item,
                      //selector: config_item.selector,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  } else {
                    b
                    let value =
                      typeof document.querySelector(config_item.selector) !==
                        "undefined"
                        ? document.querySelector(config_item.selector).href
                        : "";
                    return {
                      id: config_item.id,
                      value: value,
                      //selector: config_item.selector,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  }
                  break;
                case "SelectorImage":
                  if (config_item.multiple) {
                    const values = [];
                    document
                      .querySelectorAll(config_item.selector)
                      .forEach((el) => {
                        try {
                          const img_src =
                            el.getAttribute("src") ||
                            el.getAttribute("data-src") ||
                            el.getAttribute("data-lazy");
                          const alt =
                            el.getAttribute("alt") ||
                            el.getAttribute("data-alt") ||
                            "";
                          if (img_src) {
                            values.push({
                              src: img_src,
                              alt: alt,
                            });
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      });
                    return {
                      id: config_item.id,
                      value: values,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  } else {
                    const selector_image = document.querySelector(
                      config_item.selector,
                    );
                    if (selector_image) {
                      const img_src =
                        selector_image.getAttribute("src") ||
                        selector_image.getAttribute("data-src") ||
                        selector_image.getAttribute("data-lazy");
                      const alt =
                        el.getAttribute("alt") || el.getAttribute("data-alt");
                      if (img_src) {
                        return {
                          id: config_item.id,
                          value: { src: img_src, alt: alt || "" },
                        };
                      }
                    } else {
                      return {
                        id: config_item.id,
                        value: false,
                      };
                    }
                  }
                  break;
                case "SelectorHTML":
                  if (config_item.multiple) {
                    let values = [];
                    document
                      .querySelectorAll(config_item.selector)
                      .forEach((el) => {
                        if (el !== null && el !== undefined) {
                          values.push(el.innerHTML);
                        }
                      });
                    return {
                      id: config_item.id,
                      value: values,
                      //parentNode: config_item.  parentSelectors[0],
                    };
                  } else {
                    let value = document.querySelector(
                      config_item.selector,
                    ).innerHTML;
                    return {
                      id: config_item.id,
                      value: value,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  }
                  break;
                case "SelectorElementScroll":
                  window.scrollTo({
                    top: 1500,
                    behavior: "smooth",
                  });
                  return {
                    id: config_item.id,
                    value: true,
                    //selector: config_item.selector,
                    //parentNode: config_item.parentSelectors[0],
                  };
                  break;
                case "SelectorElementClick":
                  if (config_item.multiple === false) {
                    document.querySelector(config_item.selector).click();
                    return {
                      id: config_item.id,
                      value: true,
                      //selector: config_item.selector,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  } else {
                    let time_delay = config_item.delay || 1000;
                    document
                      .querySelectorAll(config_item.selector)
                      .forEach((el) => {
                        setTimeout(() => {
                          el.click();
                        }, time_delay + 50);
                      });
                    return {
                      id: config_item.id,
                      value: true,
                      //selector: config_item.selector,
                      //parentNode: config_item.parentSelectors[0],
                    };
                  }
                  break;
                case "SelectorPagination":
                  document.querySelector(config_item.selector).click();
                  return {
                    id: config_item.id,
                    //error: err.message,
                    value: true,
                    //selector: config_item.selector,
                    //parentNode: config_item.parentSelectors[0],
                  };
                  break;
                case "SelectorGroup":
                  break;
                case "SelectorSitemapXmlLink":
                  break;
                case "SelectorElement":
                  break;
                case "SelectorTable":
                  break;
                case "SelectorElementAttribute":
                  break;
                case "SelectorPopupLink":
                  break;
                default:
                  return {
                    id: config_item.id,
                    err_msg: "Action not allowed",
                    value: false,
                    selector: config_item.selector,
                    parentNode: config_item.parentSelectors[0],
                  };
                  break;
              }
            } catch (e) {
              console.log(e);
              return {
                id: config_item.id,
                value: false,
                selector: config_item.selector,
                //parentNode: config_item.parentSelectors[0],
                err_msg: e.message,
              };
            }
          });

          // const datum = {
          //   ...data,
          //   ...{ h1: h1, h2: h2, h3: h3, a_links: a_links },
          // };
          //Seo checkered
          const getHeadings = ["h1", "h2", "h3"];
          for (let header_tag of getHeadings) {
            try {
              const new_array = [];
              document.querySelectorAll(header_tag).forEach((el) => {
                new_array.push(
                  el.textContent.replace(/(?:\\[rn])+/g, "").trim(),
                );
              });
              data_sitemap.push({ id: header_tag, value: new_array });
            } catch (err) {
              console.log(err.message);
            }
          }
          const meta_tags = [
            [`meta[property="og:title"]`, "meta_title"],
            [`meta[property="og:description"]`, "meta_description"],
            [`meta[property="og:image"]`, "meta_image"],
            [`meta[name="og:rating"]`, "meta_rating"],
            [`meta[property="fb:pages"]`, "fb_id"],
          ];
          for (let meta_tag of meta_tags) {
            try {
              const tag_content = document
                .querySelector(meta_tag[0])
                .getAttribute("content");
              data_sitemap.push({
                id: meta_tag[1],
                value: tag_content || false,
              });
            } catch (err) {
              console.log(err.message);
            }
          }
          try {
            const jsonld = JSON.parse(
              document.querySelector('script[type="application/ld+json"]')
                .innerText,
            );
            //console.log(jsonld);
            // const structureData = await getBetween(
            //   all_html,
            //   `<script type="application/ld+json">`,
            //   `</script>`,
            // );
            data_sitemap.push({ id: "jsonLd", value: jsonld });
          } catch (err) {
            console.log("Cannot find any structureData");
          }

          try {
            let values = [];
            Array.from(document.querySelectorAll("a")).map((ahref) => {
              if (ahref.href.indexOf(hostname)) {
                return values.push(ahref.href);
              }
            });
            data_sitemap.push({ id: "links", value: values });
          } catch (err) {
            console.log(err);
          }

          await doSleep(150);
          if (notExistRequire < MAX_MISSING) {
            return data_sitemap;
          } else {
            //Maximum number of required items
            if (sitemap.isType === "list") {
              return data_sitemap;
            } else {
              return {
                code: 99,
                msg: `Missing ${notExistRequire}/${MAX_MISSING} with max_required ${max_required}`,
              };
            }
          }
        },
        sitemap,
        hostname,
      );

      if (process.env.APP_DEBUG === true) {
        await page.screenshot({ path: `${hostname}.png`, fullPage: true });
      }
      await page.close();

      //console.log(results);
      resolve(results);
    });
  }
};

module.exports = taskSitemap;

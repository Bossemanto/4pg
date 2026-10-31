const app = document.querySelector("#app");
const BRAND = "4PG Record Label";
const LOGO_LIGHT = "/assets/images/4pg-wordmark-light.png";
const HERO_YT_ID = "6OzP09nC79o";
const DATA_FILES = ["pages", "profiles", "posts", "events", "manifest", "imageVariants"];
const HERO_IMAGE_FILES = [
  "Aram 7.JPG",
  "Aram edited 1.JPG",
  "Aram edited 2.JPG",
  "Aram edited 3.JPG",
  "Aram edited 4.JPG",
  "Aram edited 5.JPG",
  "Aram edited 6.JPG",
  "Aram edited 8.JPG",
  "Aram edited 9.JPG",
  "Aram edited 10.JPG",
  "Aram edited 11.JPG",
  "IMG_4379.PNG",
  "IMG_4384.PNG",
  "IMG_4385.PNG",
  "The beginning .JPG",
  "WhatsApp Image 2026-10-27 at 11.31.45 AM.jpeg",
  "WhatsApp Image 2026-10-27 at 11.33.06 AM.jpeg",
  "WhatsApp Image 2026-10-27 at 11.52.23 AM.jpeg",
  "WhatsApp Image 2026-10-27 at 11.54.54 AM.jpeg"
];

let data;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[character]);

function decodeEntities(value = "") {
  const parsed = new DOMParser().parseFromString(String(value), "text/html");
  return parsed.documentElement.textContent || "";
}

function localAsset(source = "") {
  if (!source) return "";
  if (source.startsWith("/")) return source;
  return data.manifest[source] || source;
}

function largeImageAsset(source = "") {
  const local = localAsset(source);
  return data.imageVariants[local]?.background?.retina || local;
}

function cleanPath(pathname = location.pathname) {
  if (pathname === "/") return "/";
  return `/${pathname.split("/").filter(Boolean).join("/")}/`;
}

function image(source, alt = "", className = "") {
  const local = localAsset(source);
  const variants = data.imageVariants[local];
  const sizes = className === "mosaic-image"
    ? "(max-width: 700px) 25vw, 18vw"
    : className === "partner-logo"
      ? "180px"
      : source === LOGO_LIGHT
        ? "160px"
        : "(max-width: 700px) 90vw, 50vw";
  const srcset = variants?.srcset
    ? ` srcset="${escapeHtml(variants.srcset)}" sizes="${escapeHtml(sizes)}"`
    : "";
  const loading = className === "mosaic-image" || source === LOGO_LIGHT ? "eager" : "lazy";
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(variants?.src || local)}"${srcset} alt="${escapeHtml(alt)}" loading="${loading}" decoding="async">`;
}

function pageData(slug) {
  return data.pages.find(page => page.slug === slug);
}

function navigationMarkup(home = false) {
  const items = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about-us/" },
    {
      label: "Artist",
      href: "/artist/",
      children: [
        { label: "Roster & Producers", href: "/artist/" }
      ]
    },
    { label: "Events", href: "/events/" },
    { label: "Shop", href: "/shop/" },
    { label: "Blog", disabled: true },
    { label: "Contact", href: "/contact-us/" }
  ];

  return `<header class="site-header${home ? " site-header--home" : ""}">
    <a class="brand-mark" href="/" aria-label="${BRAND} home">${image(LOGO_LIGHT, BRAND)}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open navigation">
      <span></span><span></span><span></span>
    </button>
    <nav class="primary-navigation" id="primary-navigation" aria-label="Main navigation">
      <ul>${items.map(item => {
        if (item.disabled) {
          return `<li class="nav-item is-disabled">
            <span class="nav-link nav-link--disabled" aria-disabled="true" role="link" tabindex="-1">${escapeHtml(item.label)}</span>
          </li>`;
        }
        const current = item.href === cleanPath() || (item.href === "/artist/" && location.pathname.startsWith("/portfolio/"));
        const children = item.children
          ? `<div class="nav-submenu">${item.children.map(child => `<a href="${child.href}">${child.label}</a>`).join("")}</div>`
          : "";
        return `<li class="nav-item${item.children ? " has-submenu" : ""}${current ? " is-current" : ""}">
          <a href="${item.href}"${item.children ? ' aria-haspopup="true"' : ""}>${item.label}${item.children ? '<span class="nav-plus">+</span>' : ""}</a>${children}
        </li>`;
      }).join("")}</ul>
    </nav>
    <div class="menu-backdrop"></div>
  </header>`;
}

function pageHero(title, eyebrow = "", background = "") {
  const local = localAsset(background);
  const variants = data.imageVariants[local];
  const imageSet = variants?.background
    ? `image-set(url("${variants.background.standard}") 1x, url("${variants.background.retina}") 2x)`
    : `url("${local}")`;
  const style = background ? ` style="--page-background:${escapeHtml(imageSet)}"` : "";
  return `<section class="page-hero"${style}>
    <div class="page-hero-shade"></div>
    <div class="page-hero-copy reveal"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div>
    <span class="page-hero-index">4PG / ${String(new Date().getFullYear())}</span>
  </section>`;
}

function revealBlocks(blocks = []) {
  return blocks.map(block => {
    const tag = ["p", "h2", "h3", "h4", "h5", "li", "blockquote"].includes(block.tag) ? block.tag : "p";
    return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
  }).join("");
}

function mosaicMarkup() {
  const images = HERO_IMAGE_FILES.map(file => ({
    src: `/assets/images/hero/${encodeURIComponent(file)}`
  }));
  const columns = 6;
  const imagesPerColumn = Math.min(4, images.length);
  const tracks = Array.from({ length: columns }, (_, columnIndex) => {
    const columnImages = Array.from({ length: imagesPerColumn }, (_, imageIndex) =>
      images[(columnIndex * imagesPerColumn + imageIndex) % images.length]
    );
    const tiles = [...columnImages, ...columnImages].map(item =>
      `<div class="mosaic-tile">${image(item.src, "", "mosaic-image")}</div>`
    ).join("");
    const direction = columnIndex % 2 === 0 ? "up" : "down";
    const duration = 34 + columnIndex * 3;
    return `<div class="mosaic-column mosaic-column--${direction}" style="--mosaic-duration:${duration}s"><div class="mosaic-track">${tiles}</div></div>`;
  });
  return `<div class="photo-mosaic" aria-hidden="true">${tracks.join("")}</div>`;
}

function heroVideo() {
  return `<figure class="hero-video-card">
    <iframe class="hero-video" src="https://www.youtube.com/embed/${HERO_YT_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_YT_ID}&controls=1&rel=0&modestbranding=1" title="4PG Featured Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
    <figcaption><strong>${BRAND}</strong><span>2026</span></figcaption>
  </figure>`;
}

function artistCards(profiles = data.profiles) {
  return profiles.map((profile, index) => {
    const photo = profile.images?.[0];
    const role = profile.role || "Artist";
    return `<a class="artist-card reveal" href="${profile.path || `/${profile.slug}/`}">
      <div class="artist-card-image">${photo ? image(photo.src, photo.alt) : ""}<span class="artist-number">${String(index + 1).padStart(2, "0")}</span><span class="artist-arrow" aria-hidden="true">↗</span></div>
      <div class="artist-card-meta"><span>${escapeHtml(role)}</span><h3>${escapeHtml(profile.title)}</h3></div>
    </a>`;
  }).join("");
}

function artistsSection(fullPage = false) {
  const artists = data.profiles.filter(p => (p.role || "Artist").toLowerCase() === "artist");
  const management = data.profiles.filter(p => (p.role || "").toLowerCase() === "management");

  return `<section class="section artists-section${fullPage ? " artists-section--page" : ""}" id="artists">
    <div class="section-heading reveal"><p class="eyebrow">4PG artist</p><h2>Meet our Artists</h2></div>
    <div class="artist-grid">${artistCards(artists)}</div>
    ${management.length ? `
    <div class="management-section reveal">
      <div class="section-heading section-heading--sub">
        <p class="eyebrow">4PG Management</p>
        <h2>Management</h2>
      </div>
      <div class="artist-grid">${artistCards(management)}</div>
    </div>` : ""}
    ${fullPage ? "" : '<a class="text-link section-link" href="/artist/">View Roster &amp; Producers <span>↗</span></a>'}
  </section>`;
}

function partnerSection() {
  const page = pageData("photography");
  const logos = (page?.images || []).filter(item => /red-bull|pepsi|ballantines|hennessy|jameson|project-x|trace_tv|malta_guinness/i.test(item.src));
  const entries = logos.map(partner => image(partner.src, partner.alt, "partner-logo")).join("");
  return `<section class="section partners-section">
    <div class="section-heading reveal"><p class="eyebrow">Our Partners</p><h2>Our Partners</h2></div>
    <div class="partner-marquee"><div class="partner-track">${entries}${entries}</div></div>
  </section>`;
}

function aboutFeature() {
  const page = pageData("about-us");
  const photo = "/assets/images/hero/about-banner.JPG";
  const headline = page?.blocks?.find(block => block.tag === "h3")?.text || "Creating Timeless Classics: 4PG Record Label is Dedicated to Preserving the Best Music of Today and Tomorrow.";
  return `<section class="about-feature section">
    <div class="about-feature-image reveal">${image(photo, "4PG Record Label")}</div>
    <div class="about-feature-copy reveal"><p class="eyebrow">About 4PG</p><h2>${escapeHtml(headline)}</h2><a class="round-link" href="/about-us/" aria-label="Read about 4PG">↗</a></div>
  </section>`;
}

function homePage() {
  const intro = pageData("photography")?.blocks?.find(block => block.tag === "p" && block.text.includes("independent music imprint"))?.text || "";
  return `${navigationMarkup(true)}
    <main>
      <section class="home-hero">
        ${mosaicMarkup()}
        <div class="hero-shade"></div>
        <div class="hero-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <h1 class="sr-only">${BRAND}</h1>
        <div class="home-hero-brand">${image(LOGO_LIGHT, BRAND, "hero-logo")}</div>
        <div class="home-hero-content">${heroVideo()}<p class="hero-intro">${escapeHtml(intro)}</p></div>
      </section>
      ${artistsSection()}
      ${partnerSection()}
      ${aboutFeature()}
      ${contactSection(true)}
    </main>${footer()}`;
}

function aboutPage() {
  const page = pageData("about-us");
  const headline = page?.blocks?.find(block => block.tag === "h3")?.text || "Creating Timeless Classics: 4PG Record Label";
  const heroPhoto = "/assets/images/hero/about-banner.JPG";
  const copy = page?.blocks?.filter(block => block.tag === "p") || [];
  const sceneries = [
    { src: "/assets/images/hero/about-banner.JPG", alt: "4PG – A New Chapter, A New Energy" },
    { src: "/assets/images/hero/manager-outdoor.jpeg", alt: "4PG Management & Operations" },
    { src: "/assets/images/hero/manager-outdoor2.jpeg", alt: "4PG City Skyline View" }
  ];
  const gallery = sceneries.map(item =>
    `<button class="gallery-item" type="button" data-lightbox="${escapeHtml(largeImageAsset(item.src))}" aria-label="View ${escapeHtml(item.alt)}">${image(item.src, item.alt)}</button>`
  ).join("");

  return `${navigationMarkup()}<main class="page-content">
    ${pageHero("About Us", "4PG Record Label", heroPhoto)}
    <section class="section about-story">
      <div class="story-title"><p class="eyebrow">About 4PG</p><h2>${escapeHtml(headline)}</h2></div>
      <div class="story-copy">${copy.map(block => `<p>${escapeHtml(block.text)}</p>`).join("")}</div>
    </section>
    <section class="section scenery-section">
      <div class="section-heading"><p class="eyebrow">4PG Visuals</p><h2>4PG Scenery &amp; Culture</h2></div>
      <div class="gallery-grid">${gallery}</div>
    </section>
    <dialog class="image-lightbox"><button class="image-lightbox-close" type="button" aria-label="Close image">×</button><img data-lightbox-image alt=""></dialog>
  </main>${footer()}`;
}

function artistListing() {
  const page = pageData("artist");
  const heading = page?.title || "Roster & Producers";
  const heroImage = page?.images?.[0]?.src || "/assets/images/hero/Aram%20edited%201.JPG";
  return `${navigationMarkup()}<main class="page-content">
    ${pageHero(heading, "4PG Roster", heroImage)}
    ${artistsSection(true)}
  </main>${footer()}`;
}

function profilePage(path) {
  const profile = data.profiles.find(item => item.path === path);
  if (!profile) return notFoundPage();
  const images = profile.images || [];
  const copy = (profile.blocks || []).filter(block => block.tag === "p");
  const links = (profile.links || []).filter(link => /^https?:\/\//.test(link.href) && !link.href.includes("chocolatecitymusic.com"));
  const role = profile.role || "Artist";
  const gallery = images.slice(1).map(item => `<button class="gallery-item" type="button" data-lightbox="${escapeHtml(largeImageAsset(item.src))}" aria-label="View ${escapeHtml(item.alt)}">${image(item.src, item.alt)}</button>`).join("");
  return `${navigationMarkup()}<main class="page-content profile-page">
    ${pageHero(profile.title, `4PG ${role.toLowerCase()}`, images[0]?.src)}
    <section class="section profile-overview">
      <div class="profile-portrait reveal">${image(images[0]?.src, profile.title)}</div>
      <div class="profile-bio reveal"><p class="eyebrow">4PG / ${escapeHtml(role)}</p><h2>${escapeHtml(profile.title)}</h2>${copy.map(block => `<p>${escapeHtml(block.text)}</p>`).join("")}
        ${links.length ? `<div class="profile-socials">${links.map(link => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.text || new URL(link.href).hostname.replace(/^www\\./, ""))}</a>`).join("")}</div>` : ""}
      </div>
    </section>
    ${gallery ? `<section class="section"><div class="gallery-grid">${gallery}</div></section><dialog class="image-lightbox"><button class="image-lightbox-close" type="button" aria-label="Close image">×</button><img data-lightbox-image src="${escapeHtml(largeImageAsset(images[0]?.src))}" alt=""></dialog>` : ""}
  </main>${footer()}`;
}

function eventListing() {
  const page = pageData("events");
  const cards = data.events.map((event, index) => {
    const cover = event.images?.[0];
    const date = event.date || "16 November 2026";
    return `<article class="event-card reveal">
      <a class="event-card-image" href="/${escapeHtml(event.slug)}/">${cover ? image(cover.src, cover.alt) : ""}</a>
      <div class="event-card-content">
        <p class="eyebrow event-meta"><span class="event-release-tag">${escapeHtml(event.eventType || "Music Release")}</span><span class="event-meta-divider">/</span><strong class="event-date-prominent">${escapeHtml(date)}</strong></p>
        <h2>${escapeHtml(event.title)}</h2>
        <div class="event-card-bottom"><strong>${escapeHtml(event.artist || "Aram Jay")}</strong><a class="text-link" href="/${escapeHtml(event.slug)}/">Release details <span>↗</span></a></div>
      </div>
    </article>`;
  }).join("");
  return `${navigationMarkup()}<main class="page-content">${pageHero(page?.title || "Events", "4PG Releases", "/assets/images/hero/IMG_4379.PNG")}
    <section class="section"><div class="event-listing-heading"><span>Upcoming Releases</span><span>2026</span></div><div class="event-grid">${cards}</div></section>
  </main>${footer()}`;
}

function eventPage(path) {
  const event = data.events.find(item => `/${item.slug}/` === path);
  if (!event) return notFoundPage();
  const images = event.images || [];
  const paragraphs = (event.blocks || []).filter(block => block.tag === "p");
  const facts = (event.blocks || []).filter(block => block.tag === "li");
  const map = (event.media || []).find(item => item.tag === "iframe");
  return `${navigationMarkup()}<main class="page-content">
    ${pageHero(event.title, "4PG Music Release", images[0]?.src)}
    <section class="section event-detail">
      ${images.length ? `<div class="event-gallery event-gallery--single">${images.map(item => image(item.src, item.alt)).join("")}</div>` : ""}
      <div class="event-detail-grid">
        <div class="event-description">
          <p class="eyebrow">Release Announcement</p>
          <h2>${escapeHtml(event.title)}</h2>
          <div class="event-date-banner"><span class="eyebrow">Official Release Date</span><strong>${escapeHtml(event.date || "16 November 2026")}</strong></div>
          ${paragraphs.map(block => `<p>${escapeHtml(block.text)}</p>`).join("")}
        </div>
        <div>
          <div class="event-facts">
            ${facts.map(block => `<p><span>${escapeHtml(block.label || "Detail")}</span><strong>${escapeHtml(block.text)}</strong></p>`).join("")}
          </div>
          ${map ? `<div class="event-map"><iframe src="${escapeHtml(map.src)}" title="Event location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}
        </div>
      </div>
    </section>
  </main>${footer()}`;
}

function contactSection(compact = false) {
  const page = pageData("contact-us");
  const messageTitle = page?.blocks?.find(block => block.tag === "h3" && /message/i.test(block.text))?.text || "";
  const map = page?.media?.find(item => item.tag === "iframe");
  return `<section class="section contact-section${compact ? " contact-section--home" : ""}" id="contact">
    <div class="contact-heading reveal"><p class="eyebrow">Get in touch</p><h2>${escapeHtml(messageTitle || "Get in touch")}</h2>
      <div class="profile-socials">
        <a href="mailto:bookings@4pgrecords.com">bookings@4pgrecords.com</a>
        <a href="mailto:info@4pgrecords.com">info@4pgrecords.com</a>
      </div>
    </div>
    <form class="contact-form reveal" data-contact-form>
      <label>Full name <span>*</span><input name="name" autocomplete="name" placeholder="Your name" required></label>
      <label>Email address <span>*</span><input type="email" name="email" autocomplete="email" placeholder="Your email" required></label>
      <label class="message-field">Message<textarea name="message" rows="4" placeholder="Your message" required></textarea></label>
      <button class="button button--light" type="submit">Send message <span>↗</span></button>
      <p class="form-note" data-form-note aria-live="polite">This preview form does not send or store your details.</p>
    </form>
    ${!compact && map ? `<div class="map-section">${map.tag === "iframe" ? `<iframe src="${escapeHtml(map.src)}" title="4PG location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ""}</div>` : ""}
  </section>`;
}

function contactPage() {
  const page = pageData("contact-us");
  return `${navigationMarkup()}<main class="page-content">${pageHero(page?.title || "Contact Us", "Talk to 4PG", page?.images?.[0]?.src)}
    <section class="section contact-details">
      ${(page?.blocks || []).filter(block => block.tag === "h3" && !/message/i.test(block.text)).map((block, index) => {
        const detail = block.text;
        const link = detail.includes("@") ? `mailto:${detail}`
          : /^\+/.test(detail) ? `tel:${detail.replace(/\s+/g, "")}` : "";
        const label = detail.includes("bookings") ? "Bookings"
          : detail.includes("@") ? "General Inquiries"
          : /^\+/.test(detail) ? "Phone"
          : "Address";
        return `<article class="contact-card reveal"><span class="contact-icon">${String(index + 1).padStart(2, "0")}</span><p class="eyebrow">${label}</p><h2>${link ? `<a href="${escapeHtml(link)}">${escapeHtml(detail)}</a>` : escapeHtml(detail)}</h2></article>`;
      }).join("")}
    </section>
    ${contactSection()}
  </main>${footer()}`;
}

function basicPage(path, slug) {
  const page = pageData(slug);
  const title = page?.title || path.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Page";
  const blocks = page?.blocks || [];
  const images = page?.images || [];
  return `${navigationMarkup()}<main class="page-content">
    ${pageHero(title, "4PG Record Label", images[0]?.src)}
    <section class="section basic-page-content">${revealBlocks(blocks)}${images.length ? `<div class="gallery-grid">${images.map(item => image(item.src, item.alt)).join("")}</div>` : ""}</section>
  </main>${footer()}`;
}

function notFoundPage() {
  return `${navigationMarkup()}<main class="page-content">${pageHero("Page not found", "404")}
    <section class="section empty-cart"><p class="eyebrow">404 / Not found</p><h2>We couldn’t find that page.</h2><a class="button button--light" href="/">Back to home <span>↗</span></a></section>
  </main>${footer()}`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="footer-main"><div class="footer-top"><p class="eyebrow">Stay connected</p><h2>Get in touch.<br><a href="/contact-us/">Contact 4PG <span>↗</span></a></h2></div>
      <div class="footer-details">
        <div class="footer-brand">${image(LOGO_LIGHT, BRAND, "footer-brand-logo")}<p>${BRAND}</p></div>
        <div class="footer-contact"><p><span>Artists</span><a href="/artist/">Meet our artists</a></p><p><span>Releases</span><a href="/events/">Le Debut</a></p></div>
        <div class="footer-social"><span>Bookings &amp; Inquiries</span><a href="mailto:bookings@4pgrecords.com">bookings@4pgrecords.com</a><a href="mailto:info@4pgrecords.com">info@4pgrecords.com</a></div>
      </div>
    </div>
    <div class="footer-bottom"><a class="footer-logo" href="/" aria-label="${BRAND} home">${image(LOGO_LIGHT, BRAND)}</a><p>${BRAND} © ${new Date().getFullYear()}. All Rights Reserved.</p><div><a href="/contact-us/">Contact</a><a href="/about-us/">About 4PG</a></div></div>
  </footer>`;
}

function render() {
  const path = cleanPath();
  let markup;
  if (path === "/") markup = homePage();
  else if (path === "/about-us/") markup = aboutPage();
  else if (path === "/artist/") markup = artistListing();
  else if (path.startsWith("/portfolio/")) markup = profilePage(path);
  else if (path === "/events/") markup = eventListing();
  else if (path.startsWith("/event/")) markup = eventPage(path);
  else if (path === "/contact-us/") markup = contactPage();
  else {
    const slug = path.split("/").filter(Boolean).join("/");
    const page = pageData(slug);
    markup = page ? basicPage(path, slug) : notFoundPage();
  }

  app.innerHTML = markup;
  const heading = document.querySelector("main h1")?.innerText.replace(/\s+/g, " ").trim();
  document.title = path === "/" ? BRAND : `${heading || BRAND} - ${BRAND}`;
  document.body.classList.toggle("is-home", path === "/");
  document.body.classList.remove("menu-open");
  const menu = document.querySelector(".menu-toggle");
  if (menu) {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
  }
  observeReveals();
}

function observeReveals() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(item => item.classList.add("is-visible"));
    return;
  }
  requestAnimationFrame(() => {
    items.forEach(item => {
      const bounds = item.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) item.classList.add("is-visible");
    });
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  items.forEach(item => observer.observe(item));
}

function navigate(path) {
  if (cleanPath() === path) return;
  history.pushState({}, "", path);
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

app.addEventListener("click", event => {
  const toggle = event.target.closest(".menu-toggle");
  if (toggle) {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("menu-open", open);
    return;
  }

  if (event.target.closest(".menu-backdrop")) {
    document.body.classList.remove("menu-open");
    document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
    document.querySelector(".menu-toggle")?.setAttribute("aria-label", "Open navigation");
    return;
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    document.querySelectorAll("[data-filter]").forEach(button => button.classList.toggle("is-active", button === filter));
    document.querySelectorAll(".article-card").forEach(card => {
      card.hidden = filter.dataset.filter !== "all" && card.dataset.category !== filter.dataset.filter;
    });
    return;
  }

  const gallery = event.target.closest("[data-lightbox]");
  if (gallery) {
    const dialog = document.querySelector(".image-lightbox");
    if (dialog) {
      dialog.querySelector("[data-lightbox-image]").src = gallery.dataset.lightbox;
      dialog.showModal();
    }
    return;
  }

  const anchor = event.target.closest("a");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.classList.contains("is-disabled") || !anchor.getAttribute("href")) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin || anchor.getAttribute("href")?.startsWith("#")) return;
  event.preventDefault();
  navigate(cleanPath(url.pathname));
});

app.addEventListener("input", event => {
  if (!event.target.matches("[data-search]")) return;
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll(".article-card").forEach(card => {
    card.hidden = query && !card.innerText.toLowerCase().includes(query);
  });
});

app.addEventListener("submit", event => {
  const form = event.target.closest("[data-contact-form]");
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const note = form.querySelector("[data-form-note]");
  if (note) note.textContent = "This preview form does not send or store your details yet.";
  form.reset();
});

app.addEventListener("click", event => {
  if (event.target.closest(".image-lightbox-close")) document.querySelector(".image-lightbox")?.close();
});

app.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  document.querySelector(".image-lightbox[open]")?.close();
  document.body.classList.remove("menu-open");
  document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
  document.querySelector(".menu-toggle")?.setAttribute("aria-label", "Open navigation");
});

let activeGlowTile = null;
let glowCurrentX = 0;
let glowCurrentY = 0;
let glowTargetX = 0;
let glowTargetY = 0;
let glowRaf = null;
const glowMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.18;

function animateTileGlow() {
  if (!activeGlowTile) {
    glowRaf = null;
    return;
  }

  glowCurrentX += (glowTargetX - glowCurrentX) * glowMotion;
  glowCurrentY += (glowTargetY - glowCurrentY) * glowMotion;
  activeGlowTile.style.setProperty("--glow-x", `${glowCurrentX.toFixed(1)}px`);
  activeGlowTile.style.setProperty("--glow-y", `${glowCurrentY.toFixed(1)}px`);

  if (Math.hypot(glowTargetX - glowCurrentX, glowTargetY - glowCurrentY) > 0.2) {
    glowRaf = requestAnimationFrame(animateTileGlow);
  } else {
    glowRaf = null;
  }
}

app.addEventListener("pointermove", event => {
  if (event.pointerType === "touch") return;
  const hero = event.target.closest(".home-hero");
  const targetTile = event.target.closest(".mosaic-tile");
  const tile = targetTile || (hero && [...hero.querySelectorAll(".mosaic-tile")].find(candidate => {
    const bounds = candidate.getBoundingClientRect();
    return event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  }));

  if (!tile) {
    if (activeGlowTile) {
      activeGlowTile.classList.remove("is-lit");
      activeGlowTile = null;
    }
    return;
  }

  const bounds = tile.getBoundingClientRect();
  glowTargetX = event.clientX - bounds.left;
  glowTargetY = event.clientY - bounds.top;
  tile.dataset.glowEdge = [
    ["top", glowTargetY],
    ["right", bounds.width - glowTargetX],
    ["bottom", bounds.height - glowTargetY],
    ["left", glowTargetX]
  ].reduce((nearest, edge) => edge[1] < nearest[1] ? edge : nearest)[0];

  if (activeGlowTile !== tile) {
    activeGlowTile?.classList.remove("is-lit");
    activeGlowTile = tile;
    glowCurrentX = glowTargetX;
    glowCurrentY = glowTargetY;
    tile.classList.add("is-lit");
  }

  if (!glowRaf) glowRaf = requestAnimationFrame(animateTileGlow);
});

app.addEventListener("pointerout", event => {
  const hero = event.target.closest(".home-hero");
  if (!hero || hero.contains(event.relatedTarget)) return;
  activeGlowTile?.classList.remove("is-lit");
  activeGlowTile = null;
});

window.addEventListener("popstate", render);

async function loadData() {
  const entries = await Promise.all(DATA_FILES.map(async name => {
    const url = name === "manifest"
      ? "/assets/manifest.json"
      : name === "imageVariants"
        ? "/assets/image-variants.json"
        : `/src/data/${name}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${name} data (${response.status})`);
    return response.json();
  }));
  data = Object.fromEntries(DATA_FILES.map((name, index) => [name, entries[index]]));
  render();
}

loadData().catch(error => {
  console.error(error);
  app.innerHTML = `<main class="loading-state loading-state--error"><h1>Unable to load the site</h1><p>${escapeHtml(error.message)}</p></main>`;
});

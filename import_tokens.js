// =====================================================
// Batch update token images for Actors in a compendium
// Foundry VTT V14
// =====================================================

// ---------- CONFIG ----------
const PACK_NAME = "world.mhmm-copy"; 
// Example: "world.monsters" or "my-module.srd-monsters"

const IMAGE_FOLDER = "assets/MH Tokens"; 
// No trailing slash needed

const UPDATE_ACTOR_IMG_TOO = true;
// true  = also update actor portrait (img)
// false = only update prototype token art

const RECURSIVE = true;
// true = include files in subfolders

const ALLOWED_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "avif", "svg"];

const CASE_INSENSITIVE = true;
// true = "Goblin" matches "goblin.png"

const DRY_RUN = true;
// true  = preview only, no changes made
// false = actually update the compendium
// ----------------------------

// Normalize actor/file names for matching
function normalizeName(name) {
  let s = String(name ?? "").trim();

  if (CASE_INSENSITIVE) s = s.toLowerCase();

  // remove file extension if present
  s = s.replace(/\.[^/.]+$/, "");

  // normalize punctuation/spacing a bit
  s = s
    .replace(/[_]+/g, " ")
    .replace(/[-]+/g, " ")
    .replace(/[’'"]/g, "")
    .replace(/[(){}\[\],.:!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

// Browse folder and return all matching files
async function getFiles(folder) {
  const results = [];

  async function walk(path) {
    let browse;
    try {
      browse = await FilePicker.browse("data", path);
    } catch (err) {
      console.error(`Failed browsing path: ${path}`, err);
      throw err;
    }

    for (const file of browse.files ?? []) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) results.push(file);
    }

    if (RECURSIVE) {
      for (const dir of browse.dirs ?? []) {
        await walk(dir);
      }
    }
  }

  await walk(folder);
  return results;
}

function buildFileMap(files) {
  const map = new Map();
  const duplicates = new Map();

  for (const path of files) {
    const fileName = path.split("/").pop();
    const key = normalizeName(fileName);

    if (map.has(key)) {
      if (!duplicates.has(key)) duplicates.set(key, [map.get(key)]);
      duplicates.get(key).push(path);
    } else {
      map.set(key, path);
    }
  }

  return { map, duplicates };
}

async function run() {
  const pack = game.packs.get(PACK_NAME);
  if (!pack) {
    ui.notifications.error(`Compendium not found: ${PACK_NAME}`);
    return;
  }

  if (pack.documentName !== "Actor") {
    ui.notifications.error(`Pack ${PACK_NAME} is not an Actor compendium.`);
    return;
  }

  if (pack.locked) {
    ui.notifications.error(`Compendium is locked. Unlock it first: ${pack.title}`);
    return;
  }

  ui.notifications.info(`Loading compendium index: ${pack.title}`);
  await pack.getIndex();

  ui.notifications.info(`Scanning image folder: ${IMAGE_FOLDER}`);
  const files = await getFiles(IMAGE_FOLDER);
  if (!files.length) {
    ui.notifications.warn(`No image files found in ${IMAGE_FOLDER}`);
    return;
  }

  const { map: fileMap, duplicates } = buildFileMap(files);

  const updates = [];
  const matched = [];
  const missing = [];
  const skippedDuplicates = [];

  for (const entry of pack.index) {
    const actorName = entry.name;
    const key = normalizeName(actorName);

    if (duplicates.has(key)) {
      skippedDuplicates.push({
        actor: actorName,
        candidates: duplicates.get(key)
      });
      continue;
    }

    const imagePath = fileMap.get(key);
    if (!imagePath) {
      missing.push(actorName);
      continue;
    }

    const update = {
      _id: entry._id,
      "prototypeToken.texture.src": imagePath
    };

    if (UPDATE_ACTOR_IMG_TOO) {
      update.img = imagePath;
    }

    updates.push(update);
    matched.push({ actor: actorName, path: imagePath });
  }

  console.log("=== Token Update Preview ===");
  console.table(matched);

  if (missing.length) {
    console.log("=== No matching file found for ===");
    console.log(missing);
  }

  if (skippedDuplicates.length) {
    console.log("=== Duplicate filename matches; skipped ===");
    console.log(skippedDuplicates);
  }

  ui.notifications.info(
    `Matched ${matched.length}, missing ${missing.length}, duplicate-skipped ${skippedDuplicates.length}`
  );

  if (DRY_RUN) {
    ui.notifications.warn("Dry run only. No changes were made.");
    return;
  }

  if (!updates.length) {
    ui.notifications.warn("No updates to apply.");
    return;
  }

  const confirmed = await Dialog.confirm({
    title: "Apply Compendium Token Updates",
    content: `
      <p>Apply updates to <strong>${updates.length}</strong> actors in <strong>${pack.title}</strong>?</p>
      <p>Missing matches: ${missing.length}<br>Duplicate-skipped: ${skippedDuplicates.length}</p>
    `
  });

  if (!confirmed) {
    ui.notifications.warn("Cancelled.");
    return;
  }

  // Batch update using Actor document implementation
  const updated = await Actor.implementation.updateDocuments(updates, {
    pack: PACK_NAME
  });

  ui.notifications.info(`Updated ${updated.length} actors in ${pack.title}`);
  console.log("Updated documents:", updated);
}

run().catch(err => {
  console.error(err);
  ui.notifications.error(`Macro failed: ${err.message}`);
});
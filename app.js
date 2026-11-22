'use strict';

function initListing() {
  const list = document.querySelector('#book-list');
  if (!list) return;

  const PAGE_SIZE = 6;
  const cards = [...list.querySelectorAll('article')];
  const tools = document.querySelector('#tools');
  const searchForm = document.querySelector('#search-form');
  const searchInput = document.querySelector('#haku');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const sortToggle = document.querySelector('#sort-button');
  const sortMenu = document.querySelector('#sort-menu');
  const sortButtons = document.querySelectorAll('[data-sort]');
  const statusLine = document.querySelector('#status');
  const empty = document.querySelector('#empty');
  const loadMore = document.querySelector('#load-more');

  const state = { query: '', condition: 'kaikki', sort: 'name', visible: PAGE_SIZE };

  const byName = (a, b) => a.dataset.title.localeCompare(b.dataset.title, 'fi');
  const sorters = {
    name: byName,
    'price-asc': (a, b) => Number(a.dataset.price) - Number(b.dataset.price) || byName(a, b),
    'price-desc': (a, b) => Number(b.dataset.price) - Number(a.dataset.price) || byName(a, b),
  };

  function matches(card) {
    const query = state.query.trim().toLocaleLowerCase('fi');
    const text = `${card.dataset.title} ${card.dataset.author}`.toLocaleLowerCase('fi');
    const conditionOk = state.condition === 'kaikki' || card.dataset.condition === state.condition;
    return conditionOk && text.includes(query);
  }

  function update() {
    let matched = 0;
    let shown = 0;
    for (const card of [...cards].sort(sorters[state.sort])) {
      list.append(card);
      const isMatch = matches(card);
      if (isMatch) matched++;
      card.hidden = !(isMatch && matched <= state.visible);
      if (!card.hidden) shown++;
    }
    statusLine.textContent = matched === 0 ? 'Ei tuloksia.' : `Näytetään ${shown} / ${matched} kirjaa`;
    empty.hidden = matched !== 0;
    loadMore.parentElement.hidden = shown >= matched;
  }

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    state.visible = PAGE_SIZE;
    update();
  });

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      state.condition = button.dataset.filter;
      state.visible = PAGE_SIZE;
      for (const other of filterButtons) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      update();
    });
  }

  for (const button of sortButtons) {
    button.addEventListener('click', () => {
      state.sort = button.dataset.sort;
      state.visible = PAGE_SIZE;
      for (const other of sortButtons) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      sortToggle.textContent = `Järjestys: ${button.textContent}`;
      sortMenu.hidePopover();
      update();
    });
  }

  loadMore.addEventListener('click', () => {
    state.visible += PAGE_SIZE;
    update();
    if (loadMore.parentElement.hidden) statusLine.focus();
  });

  tools.hidden = false;
  update();
}

function initContact() {
  const form = document.querySelector('#wish-form');
  if (!form) return;

  const STORAGE_KEY = 'vanha-sivu-toive';
  const fields = [...form.querySelectorAll('input, textarea')];
  const formStatus = document.querySelector('#form-status');

  const messages = {
    nimi: { valueMissing: 'Kirjoita nimesi.' },
    sahkoposti: {
      valueMissing: 'Kirjoita sähköpostiosoitteesi.',
      typeMismatch: 'Sähköpostiosoite ei näytä oikealta. Kokeile muotoa nimi@esimerkki.fi.',
    },
    kirja: { valueMissing: 'Kirjoita kirjan nimi tai kirjailija.' },
  };

  function showError(field) {
    const error = form.querySelector(`#${field.id}-error`);
    if (!error) return true;
    let problem = null;
    if (field.required && field.value.trim() === '') problem = 'valueMissing';
    else if (field.validity.typeMismatch) problem = 'typeMismatch';
    error.textContent = problem ? `Virhe: ${messages[field.id][problem]}` : '';
    error.hidden = !problem;
    field.setAttribute('aria-invalid', String(Boolean(problem)));
    return !problem;
  }

  function clearErrors() {
    for (const field of fields) {
      field.removeAttribute('aria-invalid');
      const error = form.querySelector(`#${field.id}-error`);
      if (error) error.hidden = true;
    }
  }

  function saveDraft() {
    const draft = Object.fromEntries(fields.map((field) => [field.name, field.value]));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
    }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      for (const field of fields) field.value = draft[field.name] ?? '';
    } catch {
    }
  }

  form.addEventListener('input', (event) => {
    if (event.target.getAttribute('aria-invalid') === 'true') showError(event.target);
    saveDraft();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !showError(field));
    if (invalid.length > 0) {
      formStatus.textContent = `Lomakkeessa on ${invalid.length} korjattavaa kohtaa. Toivetta ei ole vielä lähetetty.`;
      invalid[0].focus();
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
    form.reset();
    clearErrors();
    formStatus.textContent = 'Kiitos, toiveesi on valmis! Etsimme kirjaa ja otamme yhteyttä.';
  });

  loadDraft();
}

initListing();
initContact();
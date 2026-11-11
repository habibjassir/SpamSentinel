import type { Messages } from './en.ts';

// Spanish strings. Typed as `Messages`, so a missing or extra key is a type error.
export const es: Messages = {
  appTitle: 'SpamSentinel',
  appSubtitle: 'Reglas y ajustes. Todo se queda en este navegador.',
  loading: 'Cargando…',
  saveFailed: 'No se pudieron guardar los cambios: {error}',

  languageLabel: 'Idioma',
  languageEs: 'Español',
  languageEn: 'English',

  detectorsHeading: 'Detectores',
  keywordsToggle: 'Reglas de palabras clave',
  keywordsToggleHelp: 'Marca los comentarios que coinciden con tus reglas.',
  campaignsToggle: 'Campaña repetida',
  campaignsToggleHelp:
    'Marca todo comentario que nombre un término promovido por varios comentarios marcados de autores distintos.',
  campaignNeedsKeywords:
    'La campaña repetida aprende de las coincidencias de palabras clave, así que no encuentra nada mientras las reglas de palabras clave están apagadas.',

  rulesHeading: 'Reglas de palabras clave',
  rulesHelp: 'Basta con que una regla coincida para marcar un comentario.',
  rulesEmpty: 'Todavía no hay reglas.',
  columnPattern: 'Patrón',
  columnKind: 'Tipo',
  columnMatch: 'Coincidencia',
  columnWords: 'Longitud',
  columnCategory: 'Categoría',
  columnActive: 'Activa',
  columnActions: 'Acciones',
  ruleActiveLabel: 'Activa: {pattern}',
  addRule: 'Agregar regla',
  editRule: 'Editar',
  editRuleLabel: 'Editar la regla {pattern}',
  deleteRule: 'Borrar',
  deleteRuleLabel: 'Borrar la regla {pattern}',

  ruleFormNew: 'Nueva regla',
  ruleFormEdit: 'Editar regla',
  fieldKind: 'Tipo',
  fieldPattern: 'Patrón',
  fieldMatch: 'Coincidencia',
  fieldMinWords: 'Mínimo de palabras',
  fieldMaxWords: 'Máximo de palabras',
  fieldWordsHelp: 'Opcional. La regla solo aplica a comentarios dentro de estos límites.',
  fieldCategory: 'Categoría',
  fieldCategoryHelp: 'Etiqueta libre, por ejemplo cripto o estafa.',
  fieldEnabled: 'Activa',
  kindWord: 'Palabra',
  kindPhrase: 'Frase',
  kindRegex: 'Expresión regular',
  matchWholeWord: 'Palabra completa',
  matchSubstring: 'Parte de una palabra',
  regexNote:
    'Las expresiones regulares se aplican al texto normalizado: en minúsculas y sin acentos.',
  saveRule: 'Guardar regla',
  cancel: 'Cancelar',

  wordsAny: 'Cualquiera',
  wordsMin: '{min} palabras o más',
  wordsMax: 'Hasta {max} palabras',
  wordsBetween: 'De {min} a {max} palabras',

  errorIdEmpty: 'La regla no tiene identificador.',
  errorIdDuplicate: 'Otra regla ya usa este identificador.',
  errorPatternEmpty: 'Escribe un patrón.',
  errorWordHasSpaces: 'Una regla de palabra debe ser una sola palabra. Elige Frase en su lugar.',
  errorRegexInvalid: 'Esta no es una expresión regular válida.',
  errorRegexTooLong: 'La expresión regular es demasiado larga: el límite es de {limit} caracteres.',
  errorRegexMatchesEmpty:
    'Esta expresión regular coincide con texto vacío, así que marcaría todos los comentarios.',
  errorMinWordsInvalid: 'El mínimo de palabras debe ser un número entero de 0 o más.',
  errorMaxWordsInvalid: 'El máximo de palabras debe ser un número entero de 0 o más.',
  errorWordsRange: 'El máximo de palabras no puede ser menor que el mínimo.',

  exemptHeading: 'Frases exentas',
  exemptHelp: 'Un comentario que contenga alguna de estas frases nunca se marca.',
  exemptPlaceholder: 'Por ejemplo: es una estafa',
  allowlistHeading: 'Nombres permitidos',
  allowlistHelp: 'Estos nombres nunca se vuelven términos de campaña, sin importar mayúsculas.',
  allowlistPlaceholder: 'Por ejemplo: Bitcoin',
  listAdd: 'Agregar',
  listRemoveLabel: 'Quitar {item}',
  listEmpty: 'Todavía no hay nada.',

  panelTitle: 'SpamSentinel',
  scanButton: 'Buscar spam',
  panelIdle: 'Pulsa el botón para revisar los comentarios cargados.',
  panelCounter: '{flagged} de {total} comentarios',
  panelNoComments:
    'Todavía no hay comentarios cargados. Baja hasta los comentarios y vuelve a intentarlo.',
  flaggedLabel: 'Posible spam: {reasons}',
  reasonKeyword: 'Regla: {pattern} ({category})',
  reasonKeywordNoCategory: 'Regla: {pattern}',
  reasonCampaign: 'Menciona {term}, promovido en {count} comentarios marcados',

  scanHeading: 'Escaneo',
  autoScanToggle: 'Escaneo automático',
  autoScanHelp:
    'Revisa los comentarios solo, a medida que YouTube los carga. Si está apagado, usa el botón del panel.',
  scanDelayLabel: 'Esperar antes de escanear (milisegundos)',
  scanDelayHelp:
    'Cuánto esperar después de que los comentarios dejan de cargarse, de {min} a {max}. Un valor bajo reacciona antes; uno alto trabaja menos mientras bajas rápido.',
  scanDelayInvalid: 'Escribe un número entero de {min} a {max}.',

  nextButton: 'Siguiente sospechoso',
  panelPosition: '{index} de {count} sospechosos',
};

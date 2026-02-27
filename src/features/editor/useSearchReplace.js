import { useState, useMemo, useCallback } from "react";

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function computeMatches(content, query, caseSensitive) {
  if (!query) return [];
  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegExp(query), flags);
  const matches = [];
  let match = regex.exec(content);
  while (match) {
    matches.push({ index: match.index, length: match[0].length });
    match = regex.exec(content);
  }
  return matches;
}

function replaceAt(content, start, end, value) {
  return `${content.slice(0, start)}${value}${content.slice(end)}`;
}

export function useSearchReplace(
  currentContent,
  activeFile,
  replaceCurrentFile,
  editorRefs,
) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({
    query: "",
    replaceValue: "",
    caseSensitive: false,
    cursor: -1,
  });

  // Start search
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  // Calculate matches
  const matches = useMemo(
    () => computeMatches(currentContent, state.query, state.caseSensitive),
    [currentContent, state.query, state.caseSensitive],
  );

  const selectMatch = useCallback(
    (index, length) => {
      const target = editorRefs.current[activeFile];
      if (!target) return;
      target.focus();
      target.setSelectionRange(index, index + length);
    },
    [activeFile, editorRefs],
  );

  const handleFindNext = useCallback(() => {
    if (!state.query || matches.length === 0) return;
    const next =
      matches.find((match) => match.index > state.cursor) || matches[0];
    setState((prev) => ({ ...prev, cursor: next.index }));
    selectMatch(next.index, next.length);
  }, [matches, state.cursor, state.query, selectMatch]);

  const handleReplaceNext = useCallback(() => {
    if (!state.query || matches.length === 0) return;
    const next =
      matches.find((match) => match.index > state.cursor) || matches[0];
    const replaced = replaceAt(
      currentContent,
      next.index,
      next.index + next.length,
      state.replaceValue,
    );
    replaceCurrentFile(replaced);
    const newCursor = next.index + state.replaceValue.length - 1;
    setState((prev) => ({ ...prev, cursor: newCursor }));
    selectMatch(next.index, state.replaceValue.length);
  }, [
    currentContent,
    matches,
    replaceCurrentFile,
    state.cursor,
    state.query,
    state.replaceValue,
    selectMatch,
  ]);

  const handleReplaceAll = useCallback(() => {
    if (!state.query) return;
    const flags = state.caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegExp(state.query), flags);
    replaceCurrentFile(currentContent.replace(regex, state.replaceValue));
    setState((prev) => ({ ...prev, cursor: -1 }));
  }, [
    currentContent,
    replaceCurrentFile,
    state.caseSensitive,
    state.query,
    state.replaceValue,
  ]);

  // Update handlers
  const setQuery = useCallback(
    (val) => setState((prev) => ({ ...prev, query: val, cursor: -1 })),
    [],
  );
  const setReplaceValue = useCallback(
    (val) => setState((prev) => ({ ...prev, replaceValue: val })),
    [],
  );
  const setCaseSensitive = useCallback(
    (val) => setState((prev) => ({ ...prev, caseSensitive: val, cursor: -1 })),
    [],
  );

  return {
    open,
    openSearch,
    closeSearch,
    query: state.query,
    replaceValue: state.replaceValue,
    caseSensitive: state.caseSensitive,
    matches,
    setQuery,
    setReplaceValue,
    setCaseSensitive,
    handleFindNext,
    handleReplaceNext,
    handleReplaceAll,
  };
}

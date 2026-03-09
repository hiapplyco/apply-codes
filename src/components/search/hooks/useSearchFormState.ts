'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchType } from "../types";

/**
 * Hook for managing search form state
 */
export const useSearchFormState = (
  initialSearchText: string = ""
) => {
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(initialSearchText);
  const [companyName, setCompanyName] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("candidates");
  const [searchString, setSearchString] = useState("");

  // Handle content from search params (replaces location.state)
  useEffect(() => {
    const content = searchParams.get('content');
    if (content) {
      setSearchText(content);
    }
  }, [searchParams]);

  return {
    searchText,
    setSearchText,
    companyName,
    setCompanyName,
    searchType,
    setSearchType,
    searchString,
    setSearchString
  };
};

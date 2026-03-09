'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchType } from "../types";
import { fetchSearchString } from "./utils/fetchSearchString";

export const useFormState = (
  currentJobId: number | null,
  handleSubmit: (e: any, text: string, type: SearchType, company: string) => Promise<string | null>
) => {
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("candidates");
  const [searchString, setSearchString] = useState("");

  // Handle auto-run from search params (replaces location.state)
  useEffect(() => {
    const content = searchParams.get('content');
    const autoRun = searchParams.get('autoRun');
    if (content && autoRun === 'true') {
      setSearchText(content);
      // Clear the params to prevent re-running
      window.history.replaceState({}, document.title);
      // Trigger the search
      const submitEvent = new Event('submit') as any;
      handleSubmit(submitEvent, content, searchType, companyName);
    }
  }, [searchParams, handleSubmit, searchType, companyName]);

  // Fetch search string when job is created
  useEffect(() => {
    const getSearchString = async () => {
      const searchStr = await fetchSearchString(currentJobId);
      if (searchStr) {
        setSearchString(searchStr);
      }
    };

    getSearchString();
  }, [currentJobId]);

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

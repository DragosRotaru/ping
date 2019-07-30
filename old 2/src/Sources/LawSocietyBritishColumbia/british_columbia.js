import request from "request-promise-native";
import cheerio from "cheerio";
import Debug from "debug";

const debug = Debug("British Columbia");

const URL = "https://www.lawsociety.bc.ca/lsbc/apps/lkup/mbr-search.cfm";
const FORM = {
  txt_search_type: 1,
  txt_last_nm: "aa",
  txt_given_nm: "",
  txt_city: "",
  member_search: "Search",
  is_submitted: 1,
  results_no: 50,
};

request.post(URL, FORM);
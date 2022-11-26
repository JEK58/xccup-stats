import axios from "axios";
import { groupBy } from "lodash";
import { startOfDay, format } from "date-fns";
import { de } from "date-fns/locale";
import * as fastcsv from "fast-csv";
import fs from "fs";

const ws = fs.createWriteStream("data.csv");

async function getKilometersPerDay(year?: string) {
  const res = await axios.get("https://xccup.net/api/flights", {
    params: { year },
  });
  const flights = res.data.rows;

  // Group flights by day
  const flightsPerDay = groupBy(flights, (el) =>
    startOfDay(new Date(el.takeoffTime))
  );

  const data = [];
  for (const key of Object.keys(flightsPerDay)) {
    let km = 0;
    // Cumulate km of each day
    for (let i = 0; i < flightsPerDay[key].length; i++) {
      const flight = flightsPerDay[key][i];
      km += flight.flightDistance;
    }
    const date = format(new Date(key), "P", { locale: de });

    data.push({ date, distance: Math.floor(km) });
  }

  fastcsv
    .write(data, { headers: true })
    .on("finish", function () {
      console.log("Write to CSV successfully!");
    })
    .pipe(ws);
}

getKilometersPerDay();

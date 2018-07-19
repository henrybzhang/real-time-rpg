"use strict";

import {tileList, placeList, monsterList, activeMonsters} from "../../Data.js";
import {readFile, chooseRandom, findObj} from "../../Miscellaneous.js";
import Plottable from "../Plottable.js";
import Tile from "./Tile.js";

// constants
const PLOT_CSV_FILE = "assets/plot/csv/{0}_{1}.csv";
const LAYER_NAMES = ["Bot", "Top"];

export const BIRTH_CHANCE = [0, 5, 5];

export default class Place extends Plottable {

    constructor(name, desc, parentPlace, xPos, yPos, size, hasEntry) {
        super(name, desc, parentPlace, xPos, yPos);

        this.size = size;
        this.hasEntry = hasEntry;

        this.createPlot();

        console.log("Created {0}".format(this.tag));
    }

    createPlot() {
        for(let i = 0; i < LAYER_NAMES.length; i++) {
            let plotTiles = readFile(PLOT_CSV_FILE.format(this.name, LAYER_NAMES[i]));

            let plotRows = plotTiles.split("\n");
            plotRows.pop();

            if (plotRows.length !== this.size) {
                console.error("Difference between csv and json for " + this.name);
                return;
            }

            // check for null because of plot layers
            if(this.plot === undefined) {
                this.plot = new Array(plotRows.length);
            }
            for (let y = 0; y < plotRows.length; y++) {
                if(this.plot[y] == null) {
                    this.plot[y] = new Array(plotRows.length);
                }

                let row = plotRows[y].split(",");
                for (let x = 0; x < row.length; x++) {

                    // no tile in csv file == -1
                    // city/town tile == 113
                    if (row[x] === "-1" || row[x] === "113") {
                        continue;
                    }

                    if(this.plot[y][x] == null) {
                        let tileToCopy = findObj(row[x], tileList);
                        this.plot[y][x] = new Tile(tileToCopy.name,
                                        tileToCopy.desc, tileToCopy.dangerLevel);
                        continue;
                    }
                    this.plot[y][x].addTile(findObj(row[x], tileList));
                }
            }
        }
        console.log("Created plot for {0} with size {1}".format(this.name, this.size));
    }

    /**
     * Adds the plottable to its position in the plot
     * @param {Plottable} plottable
     */
    addToPlot(plottable) {
         this.plot[plottable.yPos][plottable.xPos].addPlottable(plottable);
    }

    withinPlot(x, y) {
        return (x < this.size && x >= 0 && y < this.size && y >= 0)
    }

    getPlace(x, y) {
        if(this.withinPlot(x, y)) {
            return this.plot[y][x].getPlace();
        }
        return null;
    }

    getAllPlottables() {
        let list = [];
        for(let i = 0; i < this.size; i++) {
            for(let j = 0; j < this.size; j++) {
                let plottable = this.getTile(i, j).onTileList;
                if(Object.keys(plottable).length !== 0) {
                    list = list.concat(Object.values(plottable));
                }
            }
        }
        return list;
    }

    /**
     * @returns {Tile} The list of tiles at this coordinate in the place
     */
    getTile(xPos, yPos) {
        return this.plot[yPos][xPos];
    }

    /**
     * @param tileType {String} Name of the tile to search for
     * @returns {int[]} [xPos, yPos]
     */
    getTileCoordinates(tileType) {
        for(let y = 0; y < this.size; y++) {
            for(let x = 0; x < this.size; x++) {
                let tileID = findObj(tileType, tileList).id;
                if(this.plot[y][x].hasTile(tileID)) {
                    return [x, y];
                }
            }
        }
    }

    static birthMonsters() {

        // only birth monsters in main map for now
        for(let placeID in placeList) {
            let place = findObj("main", placeList);

            for(let i = 0; i < place.plot.length; i++) {
                for(let j = 0; j < place.plot[i].length; j++) {
                    // between 0 to 99
                    let birthChance = Math.floor(Math.random() * 100);
                    let index = place.getTile(j, i).dangerLevel;

                    // birth a random monster
                    if(birthChance < BIRTH_CHANCE[index]) {
                        let newMonster = chooseRandom(monsterList).clone(j, i);
                        activeMonsters[newMonster.id] = newMonster;
                    }
                }
            } // end of looping through the plot

            break;
        }
    }
}
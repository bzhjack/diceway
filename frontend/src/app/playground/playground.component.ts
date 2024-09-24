import {AfterViewInit, Component} from '@angular/core';
import DiceBox from "@3d-dice/dice-box";
import DisplayResults from "@3d-dice/dice-ui/src/displayResults";
import AdvancedRoller from "@3d-dice/dice-ui/src/advancedRoller";
import BoxControls from "@3d-dice/dice-ui/src/boxControls";


@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent implements AfterViewInit{
ngAfterViewInit() {
  let Box = new DiceBox("#dici-box", {
    assetPath: "/frontend/assets/dice/",
    theme: "default",
    offscreen: true,
    scale: 6
  });
  Box.init().then(async (world: any) => {
    // console.log("Box is ready");

    const Controls = new BoxControls({
      themes: ["default", "rust", "diceOfRolling", "gemstone"],
      themeColor: world.config.themeColor,
      onUpdate: (updates: any) => {
        Box.updateConfig(updates);
      }
    });
    Controls.themeSelect.setValue(world.config.theme);

    Box.onThemeConfigLoaded = (themeData: any) => {
      if (themeData.themeColor) {
        Controls.themeColorPicker.setValue(themeData.themeColor);
      }
    };

    // create display overlay
    const Display = new DisplayResults("#dici-box");

    // // create Roller Input
    const Roller = new AdvancedRoller({
      target: "#dici-box",
      onSubmit: (notation: any) => {
        console.log("notation", notation);
        Box.roll(notation)
      },
      onClear: () => {
        Box.clear();
        Display.clear();
      },
      onReroll: (rolls: any) => {
        // loop through parsed roll notations and send them to the Box
        rolls.forEach((roll: any) => Box.add(roll, roll.groupId));
      },
      onResults: (results: any) => {
        console.log("result", results);
        Display.showResults(results);
      }
    });

    // pass dice rolls to Advanced Roller to handle
    Box.onRollComplete = (results: any) => {
      Roller.handleResults(results);
    };
   Box.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
  });
}
}

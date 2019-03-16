# SmartRoomServer
The purpose of this project is to replace a central Smart-Home application, such as Apple HomeKit or Amazon Alexa

This is intended to be ran on a Raspberry Pi

![Screenshot](https://dl2.pushbulletusercontent.com/3DNc7z7XNMevIL1VvXcEitGabRN91yaT/Screen%20Shot%202019-03-16%20at%202.06.10%20AM.png)

I decided not to use an existing open-source project such as OpenHAB or Home Assistant because:
- I wanted full control over how everything looks & works
- I wanted the ability to completely design a web front-end from scratch
- I wanted to avoid any dependency on third-party cloud servers: All functionality and data controlled and managed by me
- For the experience, the fun of it, and to say it's mine

As of now, the main functionality is as follows:

- Time & Date Info

- Real-Time Weather Data via DarkSky API

- Management & Control of 'Milight' brand LED products
  - Create new Milight device via GUI, which gets persisted to MongoDB
  - CRUD functionality for all Milight devices via GUI
  - All created Milight devices populate onto the main view, from where a user can toggle the power, or adjust brightness/color
  
  *** Special thanks to the project "esp8266_milight_hub" - I am running this on a NodeMCU board, which functions as my device "hub". This provides a developer-friendly web API, and avoids the forced use of a third-party Chinese server handling all your device requests. (The official Milight brand hubs operate this way in order to provide users control from outside the local network) ***
  
- Management & Control of 'Etekcity' brand RF Outlet Switches
  - Create new outlet switch devices via GUI, persisted to MongoDB
  - Crud functionality for all devices
  - Ability for the user to detect and view the codes that the included remote control sends via the GUI, assuming you have an RF receiver wired to your Pi
  This allows for quick & easy setup without running extra command line utilities
  - All devices will populate onto the main view, from where a user can toggle the power

- Alexa Voice Control Integration (Thanks to 'fauxmojs' package)
  - On startup, all existing devices will be dynamically created as virtual switches detectable by the Alexa app
  - List of virtual switches also automatically re-generates upon new device creation or device deletion
  - After instantiating all of your devices via the GUI, you should be able to say "Alexa, discover devices", and all your created devices should show up as switches, ready to be controlled.
  - The package fauxmojs works by emulating Wemo switches, which were some of the first natively compatible switches for the Echo devices.
  I have read that due to this integration, the Alexa device is actually able to make direct requests to an API in response to voice
  commands without the need to hit the server first (this could be incorrect).

One of my primary "big-picture" goals is to create a smart home application which is as user-friendly and easy to setup and get going as possible,
comparable to a commercial product.  This includes full a GUI-based interface for the creation & management of all supported devices, with minimal user input to set up each one.
Once created, all "Switched Devices" will populate on the main device page, from where you can power them on/off, as well as adjust brightness & color values for the bulbs.
No editing of .yaml files or anything else that would intimidate a non-technical user.

In Progress:

Scenes
- A defined set of devices, each with a defined list of actions to perform
  - Ex: Lamp1: "Power On, Set Brightness to 100%", Lamp2: "Power On, Set Brightness to 50%, Color to Red", RFSwitch: "Toggle Off"
  - Although they function differently, these will be also be treatead as "SwitchedDevices" behind-the-scenes, so they will populate the
  main control panel view along with all other devices.  They will also be detected as switches by Alexa automatically.
  - A single tap of the scene within the main view will trigger the entire defined scene

Future Plans:
- Add UI controls for RGB+CCT type Milight devices (saturation & color temp)
  - Utilize a standard RGB color-picker for devices which support saturation (RGB+CCT Bulbs and/or RGBW/WW LED strips + CCT-Capable controller like FUT039)
- Finish implementation of "Scenes"
- Completely finish up implementing UI-Based management of all supported devices (including Scenes) and all cases (Create, Update, View, Delete, Trigger Actions)
- New supported device: Sonoff switches
- Potentially integrate an MQTT server, if helpful (Currently the system utilizes a REST API, Websockets, and MongoDB database persistance for all messaging and state data)
- Trigger / Action Based Automation:
  - To start, triggers will be limited to time/date, in order to create scheduled future tasks and/or repeating tasks
  - Eventually: "State-based" triggers, such as a specific value within sensor data, or another defined, logical set of requirements.
  - Each trigger will be linked to an action, which can be a single action with a specific device, or a pre-created scene

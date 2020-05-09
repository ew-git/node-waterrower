Waterrower
==========
An interface to the Waterrower rowing machine. Connect the Waterrower display to your system using the Micro USB socket. Values in the Waterrower display are read asynchronously and made available to the API. The values will start at 0, and as they are transferred the values will be updated. It usually takes 3-4 seconds for this to happen.

The node module does its best to identify the port that the Waterrower is using, and this has always worked with the limited number of systems at our disposal. They are MAC OS/10, Raspbian, Ubunutu and Windows. See below for troubleshooting.

This fork adds a basic frontend displaying 500m split time, plots by plotly.js, and the ability to save and load sessions.

![](https://user-images.githubusercontent.com/38871370/80440457-d3710600-88d6-11ea-8ab1-a738a021ecb6.png)

![](https://user-images.githubusercontent.com/38871370/80440535-f7344c00-88d6-11ea-9e00-3b76508cd8e4.png)

Troubleshooting
---------------
In the Waterrower module index.js file change debug to true. Restarting your program will show the ports that have been found. For example, on a MAC :

```
// Read Waterrower
//
// Initialise
var debug = true;

Output:
$ node index.js
in readWrite closed call open
Number of ports=3
com name /dev/cu.Bluetooth-Incoming-Port
port ID
com name /dev/cu.Bluetooth-Modem
port ID
com name /dev/cu.usbserial-A800etv2
port ID
in readWrite open call read
in read connecting to /dev/cu.usbserial-A800etv2
Stroke Rate ....................0
Total Speed ....................0
Average Speed ..................0
Distance... ....................0
Heart Rate .....................0
in readWrite connecting
in read open
```

On some platforms, such as Ubuntu, the user may not have access to the serial
device. On Ubuntu, add the user to the `dialout` group, as described in
https://askubuntu.com/a/522776
```
sudo usermod -a -G dialout $USER
sudo reboot
```
Verify the user is added with `id -Gn`.

The `/dev/` devices are searched for the following strings:
```
ttyACM
cu.usbserial
u.usbmodem
```

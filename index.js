// Helper class
utils = {
  'spanText': function(clazz, text) {
    output = '';
    for (index = 0; index < arguments.length; index += 2) {
      output += '<span class="' + arguments[index] + '">' + arguments[index + 1] + '</span>';
    }
    return output
  },
  'formatSpaces': function(name, spaces) {
    var emptyString = '';
    while (emptyString.length < spaces) emptyString += ' ';
    return (name + emptyString).slice(0, spaces);
  },
  'padNumber': function(value, spaces) {
    var emptyString = '';
    while (emptyString.length < spaces) emptyString += '0';
    return (emptyString + value).slice(('' + value).length);
  }
}
var Commands = function(hostline, user, group) {
  exponent = Math.floor((Math.random() * 4));
  hd_size = 64 << exponent; // Random but within the specified range
  dd_duration = (hd_size >> 6) * 500; // Make the base length stable
  dd_device = 'sda' // This probably won't gain 'coolness' from changing
  dd_block_size = 4 // Assumed MB
  var file = function(user, group, file, file_link) {
    return '-rw-r--r--   1 ' + utils.formatSpaces(user, 5) + ' ' + utils.formatSpaces(group, 5) + ' 147K Mar 29  09:56 ' +
      '<a class="softlink-target" href=' + file_link + '>' + file + '</a>';
  }
  var softLink = function(user, group, source, target) {
    return 'lrwxrwxrwx   1 ' + utils.formatSpaces(user, 5) + ' ' + utils.formatSpaces(group, 5) + ' 4.0K Mar 29  22:09 ' + utils.spanText('softlink',
      source) + ' -> ' + '<a class="softlink-target" href=' + target + '>' + target + '</a>';
  }
  var ddCopyOutput = function(device, size_gb, block_size, duration) {
    var records = (size_gb << 10) / block_size;
    var variance = Math.random();
    var true_duration = duration / 1000.0 + variance;
    var throughput = size_gb / true_duration;
    // This is stupid but JS seems to roll over at a certain point for ints 2^32 < x < 2^64
    // so we do this digit-trim hack to display it correctly
    var bytes_copied = (size_gb << 20) / 1000;
    bytes_copied <<= 10;
    return records + '+0 records in\n' + records + '+0 records out\n' + bytes_copied + '000 bytes (' + size_gb + ' GB) copied, ' + true_duration.toFixed(5) +
      ' s, ' + throughput.toFixed(1) + ' GB/s';
  }
  return {
    'poweroff': {
      typedCommand: "poweroff",
      startDelay: 1250,
      hesitation: 200,
      duration: 0,
      output: "\nBroadcast message from " + hostline + "\n\t\t(/dev/pts/0) at " + utils.padNumber(new Date().getHours(), 2) + ":" + utils.padNumber(new Date()
        .getMinutes(), 2) + "...\n\n" + "The system is going down for halt NOW!"
    },
    'get_users': {
      typedCommand: 'awk -F: /^.*:x:[0-9]{4}:/\'{print $1}\' /etc/passwd',
      startDelay: 1250,
      hesitation: 200,
      duration: 100,
      output: user
    },
    'ls_home': {
      typedCommand: 'ls -la ~' + user,
      startDelay: 1250,
      hesitation: 200,
      duration: 100,
      output:
         'drwx------ 113 ' + utils.formatSpaces(user, 5) + ' ' + utils.formatSpaces(group, 5) + ' 4.0K Jul 24  17:00 .\n' +
         'drwxr-xr-x   6 ' + utils.formatSpaces('root', 5) + ' ' + utils.formatSpaces('root', 5) + ' 4.0K Jan  6  18:57 ..\n' +
         softLink(user, group, 'files',      'http://files.vdoster.com') + '\n' +
         softLink(user, group, 'github',     'http://github.vdoster.com') + '\n' +
         softLink(user, group, 'linkedin',   'http://linkedin.vdoster.com') + '\n' +
         softLink(user, group, 'music',      'http://rap-diablo.vdoster.com') + '\n' +
         file(    user, group, 'keybase.txt','https://raw.githubusercontent.com/vladdoster/vdoster.com/master/keybase.txt') + '\n' +
         file(    user, group, 'resume.pdf', 'https://drive.google.com/file/d/1jeVb7rZ6IN4288ayXhmJ6vU44O4rFddC/view?usp=drivesdk')
         // 'https://github.com/vladdoster/resume-src-code/raw/master/resume.pdf')

    },
    'dd_partition': {
      typedCommand: 'dd if=/dev/urandom of=/dev/' + dd_device + ' bs=' + dd_block_size + 'M',
      startDelay: 1200,
      hesitation: 3000,
      duration: dd_duration,
      output: ddCopyOutput(dd_device, hd_size, dd_block_size, dd_duration)
    },
  };
};
var Scroller = function(target) {
  hostline = "[root@" + (window.location.hostname || 'localhost') + "]";
  bash_prompt = utils.spanText('prompt-hostline', hostline, 'prompt-path', "~", 'prompt-normal', "$ ");
  commands = new Commands(hostline, 'vlad', 'vlad');
  textSpeed = 19;
  textSpeedJitter = 12;
  textStartSpeed = 800;
  newlineSpeed = 400;
  promptDelay = 1000;
  textPos = 0;
  typingAudio = new Audio('sounds/typing.mp3')
  typingAudio.loop = true;
  typingAudio.preload = true;
  commandList = ['get_users', 'ls_home', 'dd_partition', 'poweroff'];
  cursorSpeed = 500;
  cursorShowing = false;
  cursorStates = ['_', ' '];
  addTextInstant = function(targetElement, text) {
    var oldText = targetElement.innerHTML;
    targetElement.innerHTML = oldText + text;
  };
  removeCursor = function(targetElement) {
    var oldText = targetElement.innerHTML;
    targetElement.innerHTML = oldText.substring(0, oldText.length - 1);
  };
  addPrompt = function(targetElement) {
    addTextInstant(targetElement, bash_prompt);
  };
  updateCursorState = function(text) {
    var oldText = document.getElementById(target).innerHTML || "";
    if (!text) {
      oldText += " ";
    }
    this.cursorShowing = !this.cursorShowing;
    newText = oldText.substring(0, oldText.length - 1) + this.cursorStates[this.cursorShowing ? 0 : 1];
    document.getElementById(target).innerHTML = newText;
    setTimeout(function() {
      this.updateCursorState(newText);
    }, this.cursorSpeed);
  };
  addTypedText = function(targetElement, typedText, commandIndex, typingAudio, originalText, textIndex) {
    // Could have assumed ECMA6 and done default params but this is more compatible
    if (!originalText) originalText = targetElement.innerHTML;
    if (!textIndex) textIndex = 0;
    this.addTextInstant(targetElement, typedText.substring(textIndex, textIndex + 1));
    if (textIndex <= typedText.length) {
      textIndex++;
      if (textIndex == typedText.length) {
        typingAudio.pause();
        this.addTextInstant('_');
        setTimeout(function() {
          printCommandOutput(targetElement, command, commandIndex);
        }, command.hesitation);
      } else {
        randomJitter = this.textSpeedJitter * Math.random();
        jitteredTextSpeed = this.textSpeed + (randomJitter / 2);
        setTimeout(function() {
          this.addTypedText(targetElement, typedText, commandIndex, typingAudio, originalText, textIndex);
        }, jitteredTextSpeed);
      }
    }
  };
  typeCommand = function(targetElement, command, index) {
    typingAudio.play();
    addTypedText(targetElement, command.typedCommand + '\n', index, typingAudio);
  };
  printCommandOutput = function(targetElement, command, commandIndex) {
    removeCursor(targetElement);
    var outputElement = document.createElement('p');
    outputElement.className += "command-output";
    targetElement.appendChild(outputElement);
    addTextInstant(outputElement, command.output);
    setTimeout(function() {
      executeCommands(targetElement, commandIndex + 1);
    }, promptDelay);
  };
  executeCommand = function(targetElement, commandIndex) {
    commandName = commandList[commandIndex];
    command = commands[commandName];
    console.log('Command: ' + commandName);
    addPrompt(targetElement);
    setTimeout(function() {
      typeCommand(targetElement, command, commandIndex);
    }, command.startDelay);
  };
  executeCommands = function(targetElement, commandIndex) {
    if (!commandIndex) commandIndex = 0;
    if (commandIndex >= commandList.length) return;
    var targetElement = document.createElement('p');
    targetElement.id = 'command_' + commandIndex;
    document.getElementById(target).appendChild(targetElement);
    executeCommand(targetElement, commandIndex);
  };
  executeCommands();
}

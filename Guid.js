// IfcGuid
// ----------------------------------------------------------------------------
// This class is a service class providing methods to generation and conversion
// between compressed and uncompressed string representations of GUIDs
// according to the algorithms used by the Industry Foundation Classes (IFC).
// The algorithm is based on an implementation in c as follows: 
// originally proposed by Jim Forester.
// implemented previously by Jeremy Tammik using hex-encoding
// Peter Muigg, June 1998
// Janos Maros, July 2000
//
// Provided "as-is", no warranty, no support is given to the users of this code
// ----------------------------------------------------------------------------
// Jonathon Broughton, September 2017
//
var Guid = (function(ns) {
  
  var base64Chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B',
                     'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
                     'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                     'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
                     'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
                     'y', 'z', '_', '$'];
  
  var toUInt32 = function(bytes, index) {
    return (parseInt(bytes
                     .slice(index, index + 4)
                     .reduce(function(str, v) {
                       return str + v;
                     }, ""), 16)) >>> 0;
  };
  
  var toUInt16 = function(bytes, index) {
    return (parseInt(bytes
                     .slice(index, index + 2)
                     .reduce(function(str, v) {
                       return str + v;
                     }, ""), 16)) >>> 0;
  };
  
  var hex = function(input) {
    return input.toString(16);
  };
  
  var pad = function(char, input, length, join) {
    if (Array.isArray(input)) {
      input = input.map(function(i) {
        return pad(char, i, length);
      });
      return join ? input.join('') : join;
    } else {
      return (char * length + input).slice(-length);
    }
  };
  
  var cv_to_64 = function(number, result, start, len) {
    var num = number,
        n = len,
        i;
    
    for (i = 0; i < n; i += 1) {
      result[start + len - i - 1] = base64Chars[parseInt(num % 64, 10)];
      num = num / 64;
    }
    return result;
  };
  
  var cv_from_64 = function(str, start, len) {
    var i, j, index,
        res = 0;
    
    for (i = 0; i < len; i += 1) {
      index = -1;
      for (j = 0; j < 64; j += 1) {
        if (base64Chars[j] === str[start + i]) {
          index = j;
          break;
        }
      }
      res = res * 64 + (index >>> 0);
    }
    return res;
  };
  
  ns.fromFullToCompressed = function(guid) {
    
    var i, n = 2,
        pos = 0,
        str = [],
        num = [];
    
    var headBytes = (function(guid) {
      var bytes = [];
      guid.split('-').map(function(number, index) {
        var bytesInChar = number.match(/.{1,2}/g);
        bytesInChar.map(function(byte) { bytes.push(byte); });
      });
      return bytes;
    }(guid));
    
    var tailBytes = (function(guid) {
      var bytes = [];
      guid.split('-').map(function(number, index) {
        var bytesInChar = number.match(/.{1,2}/g);
        bytesInChar.map(function(byte) { bytes.push(parseInt(byte, 16)); });
      });
      return bytes;
    }(guid));
    
    num[0] = (toUInt32(headBytes, 0) / 16777216) >>> 0;
    num[1] = (toUInt32(headBytes, 0) % 16777216) >>> 0;
    num[2] = (toUInt16(headBytes, 4) * 256 + toUInt16(headBytes, 6) / 256) >>> 0;
    num[3] = ((toUInt16(headBytes, 6) % 256) * 65536 + tailBytes[8] * 256 + tailBytes[9]) >>> 0;
    num[4] = (tailBytes[10] * 65536 + tailBytes[11] * 256 + tailBytes[12]) >>> 0;
    num[5] = (tailBytes[13] * 65536 + tailBytes[14] * 256 + tailBytes[15]) >>> 0;
    
    for (i = 0; i < 6; i++) {
      str = cv_to_64(num[i], str, pos, n);
      pos += n;
      n = 4;
    }
    
    return str.join('');
  };
  
  ns.fromCompressedToFull = function(compressed) {
    
    var fullGuid = "",
        num = [],
        str = compressed.split(''),
        n = 2,
        pos = 0,
        i;
    
    for (i = 0; i < 6; i += 1) {
      num[i] = cv_from_64(str, pos, n);
      pos += n;
      n = 4;
    }
    
    var a = hex(num[0] * 16777216 + num[1] >>> 0);
    var b = hex((num[2] / 256) >>> 0);
    var c = hex(((num[2] % 256) * 256 + num[3] / 65536) >>> 0);
    var d = [];
    
    d[0] = hex(((num[3] / 256) % 256) >>> 0);
    d[1] = hex(((num[3]) % 256) >>> 0);
    d[2] = hex((num[4] / 65536) >>> 0);
    d[3] = hex((num[4] / 256) % 256 >>> 0);
    d[4] = hex((num[4]) % 256 >>> 0);
    d[5] = hex((num[5] / 65536) >>> 0);
    d[6] = hex((num[5] / 256) % 256 >>> 0);
    d[7] = hex((num[5]) % 256 >>> 0);
    
    return [
      pad("0", a.toString(16), 8),
      pad("0", b.toString(16), 4),
      pad("0", c.toString(16), 4),
      pad("0", d.slice(0, 2), 2, true),
      pad("0", d.slice(2), 2, true)
    ]
    .join('-');
  };
  
  return ns;
}(Guid || {}));

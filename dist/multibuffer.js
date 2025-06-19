"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MultiBuffer {
    #buffers;
    #length;
    constructor(...buffers) {
        this.#buffers = [];
        this.#length = 0;
        for (let buffer of buffers) {
            if (buffer.length) {
                this.#buffers.push(buffer);
                this.#length += buffer.length;
            }
        }
    }
    #getRange(start, end = 0) {
        let head = start, buffers = this.#buffers, i = 0, length = end - start;
        let range = { buffers: [], start: 0, end: 0, index: 0, length: 0 };
        if (buffers.length) {
            if (start < buffers[0].length) {
                range.start = start;
                range.index = 0;
                range.buffers.push(buffers[0]);
            }
            else {
                start -= buffers[0].length;
                while (++i < buffers.length) {
                    if (start < buffers[i].length) {
                        range.start = start;
                        range.index = i;
                        range.buffers.push(buffers[i]);
                        break;
                    }
                    else {
                        start -= buffers[i].length;
                    }
                }
            }
            if (range.start !== undefined && end !== 0) {
                if (end >= this.#length) {
                    range.buffers = this.#buffers.slice(range.index);
                    range.length = this.#length - head;
                    range.end = range.buffers[range.buffers.length - 1].length;
                    if (start > 0) {
                        range.buffers[0] = range.buffers[0].slice(start);
                    }
                    return range;
                }
                else if (range.start + length <= buffers[range.index].length) {
                    range.end = range.start + length;
                    range.length = length;
                }
                else {
                    length -= buffers[range.index].length - range.start;
                    range.length += buffers[range.index].length - range.start;
                    while (++i < buffers.length) {
                        range.buffers.push(buffers[i]);
                        if (length <= buffers[i].length) {
                            range.end = length;
                            range.length += length;
                            break;
                        }
                        else {
                            length -= buffers[i].length;
                            range.length += buffers[i].length;
                        }
                    }
                }
            }
            if (range.buffers.length === 1 && (range.start !== 0 || range.end !== range.buffers[0].length)) {
                range.buffers[0] = range.buffers[0].subarray(range.start, range.end);
            }
            else if (range.buffers.length > 1) {
                if (range.start !== 0) {
                    range.buffers[0] = range.buffers[0].subarray(range.start);
                }
                if (range.end !== range.buffers[range.buffers.length - 1].length) {
                    range.buffers[range.buffers.length - 1] = range.buffers[range.buffers.length - 1].subarray(0, range.end);
                }
            }
        }
        return range;
    }
    append(...buffers) {
        for (let buffer of buffers) {
            if (buffer.length) {
                this.#buffers.push(buffer);
                this.#length += buffer.length;
            }
        }
    }
    slice(start, end) {
        if (start === undefined) {
            start = 0;
        }
        if (start < 0) {
            start = this.#length + start;
        }
        if (end === undefined) {
            end = this.#length;
        }
        if (end < 0) {
            end = this.#length + end;
        }
        end = Math.min(this.#length, end);
        return start < end ? this.#getRange(start, end).buffers : [];
    }
    splice(start = 0, deleteCount = 0, ...buffers) {
        if (start < 0) {
            start = this.#length + start;
        }
        let end = deleteCount < 0 ? this.#length + deleteCount : start + deleteCount;
        let range = this.#getRange(start, end), spliceStart;
        if (range.buffers.length && start !== end) {
            this.#length -= range.length;
            if (this.#length === 0) {
                this.#buffers = [];
            }
            else {
                let spliceCount = Math.max(0, range.buffers.length - 2);
                if (range.buffers.length === 1) {
                    if (range.start === 0) {
                        if (range.end === this.#buffers[range.index].length) {
                            this.#buffers.splice(range.index, 1);
                        }
                        else {
                            this.#buffers[range.index] = this.#buffers[range.index].subarray(range.end);
                        }
                    }
                    else if (range.end === this.#buffers[range.index].length) {
                        this.#buffers[range.index] = this.#buffers[range.index].subarray(0, range.start);
                    }
                    else {
                        let tail = this.#buffers[range.index].subarray(range.end);
                        this.#buffers[range.index] = this.#buffers[range.index].subarray(0, range.start);
                        this.#buffers.splice(range.index + 1, 0, tail);
                    }
                }
                else {
                    if (range.start === 0) {
                        spliceStart = range.index;
                        ++spliceCount;
                    }
                    else {
                        spliceStart = range.index + 1;
                        this.#buffers[range.index] = this.#buffers[range.index].slice(0, range.start);
                    }
                    if (range.end === this.#buffers[range.index + range.buffers.length - 1].length) {
                        ++spliceCount;
                    }
                    else {
                        this.#buffers[range.index + range.buffers.length - 1] = this.#buffers[range.index + range.buffers.length - 1].slice(range.end);
                    }
                    if (spliceCount) {
                        this.#buffers.splice(spliceStart, spliceCount);
                    }
                }
            }
        }
        if (buffers.length) {
            this.#length += buffers.reduce((s, b) => s += b.length, 0);
            if (range.buffers.length === 0) {
                range.index = this.#buffers.length;
            }
            else if (range.start !== 0) {
                if (range.start < this.#buffers[range.index].length) {
                    let tail = this.#buffers[range.index].slice(range.start);
                    this.#buffers[range.index] = this.#buffers[range.index].slice(0, range.start);
                    buffers.push(tail);
                }
                ++range.index;
            }
            this.#buffers.splice(range.index, 0, ...buffers);
        }
        return (start !== end) ? range.buffers : [];
    }
    spliceConcat(start, deleteCount, ...buffers) {
        buffers = this.splice(start, deleteCount, ...buffers);
        return buffers.length ? (buffers.length === 1 ? buffers[0] : Buffer.concat(buffers)) : Buffer.alloc(0);
    }
    /*compact( start, end )
    {

    }*/
    get(index) {
        if (index < 0) {
            index = this.#length + index;
        }
        let range = this.#getRange(index);
        return range.buffers.length ? range.buffers[0][0] : undefined;
    }
    set(index, value) {
        if (index < 0) {
            index = this.#length + index;
        }
        let range = this.#getRange(index);
        return range.buffers[0] = value;
    }
    #equals(buffer, block, index, length) {
        let buff = this.#buffers[block], matched = 0;
        if (buff[index] === buffer[matched]) {
            do {
                if (++matched === length) {
                    return true;
                }
                else {
                    if (++index >= buff.length) {
                        buff = this.#buffers[++block];
                        index = 0;
                    }
                }
            } while (buff[index] === buffer[matched]);
        }
        return false;
    }
    equals(buffer, offset = 0, length = Infinity) {
        length = Math.min(length, buffer.length);
        if (offset + length <= this.#length) {
            let range = this.#getRange(offset);
            return this.#equals(buffer, range.index, range.start, length);
        }
        return false;
    }
    indexOf(buffer, offset = 0, encoding = 'utf8') {
        if (typeof buffer === 'string') {
            buffer = Buffer.from(buffer, encoding);
        }
        if (offset < 0) {
            offset = this.#length - offset;
        }
        if (buffer.length === 0) {
            return offset < this.#length ? offset : -1;
        }
        let b = 0, buff = this.#buffers[0], i = 0, index = 0, until = this.#length - buffer.length;
        while (index <= until && index < offset) {
            if (offset - index <= buff.length) {
                i = offset - index;
                index = offset;
            }
            else {
                index += buff.length;
                buff = this.#buffers[++b];
            }
        }
        while (index <= until) {
            if (i + buffer.length <= buff.length) {
                let m = buff.indexOf(buffer, i);
                if (m !== -1) {
                    return index + m - i;
                }
                else {
                    m = buff.length - buffer.length;
                    index += m - i;
                    i = m;
                    m = 0;
                }
            }
            while (index <= until && i < buff.length) {
                if (this.#equals(buffer, b, i, buffer.length)) {
                    return index;
                }
                ++i;
                ++index;
            }
            buff = this.#buffers[++b];
            i = 0;
        }
        return -1;
    }
    partialIndexOf(buffer, offset = 0, encoding = 'utf8') {
        if (typeof buffer === 'string') {
            buffer = Buffer.from(buffer, encoding);
        }
        let indexOf = this.indexOf(buffer, offset, encoding);
        if (indexOf === -1) {
            for (let length = Math.min(buffer.length - 1, this.#length); length > 0; --length) {
                if (this.equals(buffer, this.#length - length, length)) {
                    return this.#length - length;
                }
            }
        }
        return indexOf;
    }
    get length() {
        return this.#length;
    }
    clear() {
        this.#buffers = [];
        this.#length = 0;
    }
}
exports.default = MultiBuffer;

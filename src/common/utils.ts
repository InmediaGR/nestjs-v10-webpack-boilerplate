import bcrypt from 'bcrypt';

/**
 * generate hash from password or string
 * @param {string} password
 * @returns {string}
 */
export function generateHash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * validate text with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function validateHash(
  password: string | undefined,
  hash: string | undefined,
): Promise<boolean> {
  if (!password || !hash) {
    return Promise.resolve(false);
  }

  return bcrypt.compare(password, hash);
}

export function getVariableName<TResult>(getVar: () => TResult): string {
  const m = /\(\)=>(.*)/.exec(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    getVar.toString().replaceAll(/(\r\n|\n|\r|\s)/gm, ''),
  );

  if (!m) {
    throw new Error(
      "The function does not contain a statement matching 'return variableName;'",
    );
  }

  const fullMemberName = m[1];

  const memberParts = fullMemberName.split('.');

  return memberParts.at(-1) as string;
}


export const sortArrayOfObjects = (arr:any[], p: string, direction: string = 'ASC'): any[] => {
  if (direction === 'DESC') {
    return arr.slice(0).sort(function(a,b) {
      return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
    });
  }

  return arr.slice(0).sort(function(a,b) {
    return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
  });
}


const currencyFormatterFourDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
  // minimumIntegerDigits: 1,
  // notation: "standard",
  // numberingSystem: "latn",
  // signDisplay: "auto",
  // style: "decimal",
  // useGrouping: true,
})

const currencyFormatterTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  // minimumIntegerDigits: 1,
  // notation: "standard",
  // numberingSystem: "latn",
  // signDisplay: "auto",
  // style: "decimal",
  // useGrouping: true,
})





export const formatNumberToCurrency = (val:number, digits: number) => {
  if (digits === 2) {
    return !isNaN(val) ? currencyFormatterTwoDecimals.format(val) : val;
  }
  return !isNaN(val) ? currencyFormatterFourDecimals.format(val) : val;
}

export const formatNumberWithPrecision = (data: number, precision?: number) => {
  return precision ? data.toPrecision(precision) : data;
}




// export {sortArrayOfObjects}

// export function sortArrayOfObjects(arr:any[], p: string, direction: string = 'ASC'): any[] {
//   if (direction === 'DESC') {
//     return arr.slice(0).sort(function(a,b) {
//       return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
//     });
//   }
//
//   return arr.slice(0).sort(function(a,b) {
//     return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
//   });
// }

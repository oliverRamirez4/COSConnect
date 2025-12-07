class Shelter {
    private bio: string;
    private numTotBeds: number;
    private numOpenBeds: number;
    private latitude: number;
    private longitude: number;
  
    constructor(
      bio: string,
      numTotBeds: number,
      numOpenBeds: number,
      latitude: number,
      longitude: number
    ) {
      this.bio = bio;
      this.numTotBeds = numTotBeds;
      this.numOpenBeds = numOpenBeds;
      this.latitude = latitude;
      this.longitude = longitude;
    }
  
    getBio(): string {
      return this.bio;
    }
  
    setNumTotBeds(numTotBeds: number): void {
      this.numTotBeds = numTotBeds;
    }
  
    getNumTotBeds(): number {
      return this.numTotBeds;
    }
  
    setNumOpenBeds(numOpenBeds: number): void {
      this.numOpenBeds = numOpenBeds;
    }
  
    getNumOpenBeds(): number {
      return this.numOpenBeds;
    }
  
    addOpenBeds(numBeds: number): void {
      this.numOpenBeds += numBeds;
    }
  
    getLatitude(): number {
      return this.latitude;
    }
  
    getLongitude(): number {
      return this.longitude;
    }
  
    setLatitude(latitude: number): void {
      this.latitude = latitude;
    }
  
    setLongitude(longitude: number): void {
      this.longitude = longitude;
    }
  }
  
  export default Shelter;